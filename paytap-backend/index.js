const express = require('express');
const admin = require('firebase-admin');
require('dotenv').config();
const cors = require('cors');
const os = require('os');
const { supabase } = require('./Supabase/supabaseClient');

const app = express();

// ✅ ALLOW BOTH ADMIN AND POS
const allowedOrigins = [
  'http://localhost:5173',  // Admin frontend (Vite default)
  'http://localhost:5174',  // POS frontend (if on different port)
  'http://localhost:3000',  // Alternative ports
  'http://localhost:3001',
  process.env.ADMIN_URL,
  process.env.POS_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (ESP32, Postman, mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('⚠️ Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Firebase Admin setup
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
});

// Middleware
const verifyFirebaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

// Routes
const rfidRoutes = require('./routes/rfidRoutes');
app.use('/api/rfid', rfidRoutes);

// Health check endpoint (useful for POS to verify connection)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'PayTap Backend'
  });
});

// Helper function
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 5000;
const localIP = getLocalIP();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on:`);
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://${localIP}:${PORT}`);
  console.log(`   - All interfaces: http://0.0.0.0:${PORT}`);
  console.log(`\n📱 ESP32 Configuration:`);
  console.log(`   const char* serverUrl = "http://${localIP}:${PORT}/api/rfid";`);
  console.log(`\n💻 POS Configuration:`);
  console.log(`   VITE_API_URL=http://${localIP}:${PORT}`);
});

// Add at the top with other requires
const WebSocket = require('ws');

// After your app.listen(), add:
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('📱 ESP32 connected via WebSocket');
  
  ws.on('message', (message) => {
    console.log('Message from ESP32:', message.toString());
    
    // Broadcast to all connected clients (POS systems)
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  
  ws.on('close', () => {
    console.log('📱 ESP32 disconnected');
  });
});

console.log('🔌 WebSocket server running on port 8080');