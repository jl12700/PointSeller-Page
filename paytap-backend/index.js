const express = require('express');
const admin = require('firebase-admin');
require('dotenv').config();
const cors = require('cors');
const { supabase } = require('./Supabase/supabaseClient');

const app = express();
app.use(cors());
app.use(express.json());

// ===== INITIALIZE FIREBASE =====
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
});

// ===== IMPORT RFID ROUTES =====
const rfidRoutes = require('./routes/rfidRoutes');

// ===== MIDDLEWARE: Verify Firebase Token =====
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

// ===== USE ROUTES =====
app.use('/api/rfid', rfidRoutes);

// ... rest of your endpoints ...

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});