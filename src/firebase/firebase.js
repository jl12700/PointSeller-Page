// firebase.js in your PayTap website (React)

// Import needed SDKs
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// MAIN PayTap Website Firebase
const paytapConfig = {
  apiKey: "AIzaSyBZNYRzwEpTL1N6kkClqG5skv5DBw7RhC4",
  authDomain: "paytap-thesis.firebaseapp.com",
  projectId: "paytap-thesis",
  storageBucket: "paytap-thesis.firebasestorage.app",
  messagingSenderId: "19728474877",
  appId: "1:19728474877:web:f86e3069a4927c3beb9494",
  measurementId: "G-TBG7D2XYGV"
};

// POS Firebase Config (from your Vite + React POS)
const posConfig = {
  apiKey: "AIzaSyCllUV-ibpbQTPDI2PAwSR-v0ZwN6C8dKw",
  authDomain: "paytap-pos.firebaseapp.com",
  projectId: "paytap-pos",
  storageBucket: "paytap-pos.firebasestorage.app",
  messagingSenderId: "536726344133",
  appId: "G-SH3XL8BS7D"
};

// Initialize main PayTap app (default)
const app = !getApps().length ? initializeApp(paytapConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize secondary POS app (named instance)
const posApp = !getApps().some(app => app.name === "posApp")
  ? initializeApp(posConfig, "posApp")
  : getApp("posApp");

const posDb = getFirestore(posApp);
const posStorage = getStorage(posApp);

export { app, auth, db, storage, posApp, posDb, posStorage };
