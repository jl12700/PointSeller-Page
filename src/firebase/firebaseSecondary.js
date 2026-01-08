// firebase/firebaseSecondary.js
// Secondary Firebase app instance for creating users without logging out admin

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Use your MAIN PayTap config (same as your primary app)
const paytapConfig = {
  apiKey: "AIzaSyBZNYRzwEpTL1N6kkClqG5skv5DBw7RhC4",
  authDomain: "paytap-thesis.firebaseapp.com",
  projectId: "paytap-thesis",
  storageBucket: "paytap-thesis.firebasestorage.app",
  messagingSenderId: "19728474877",
  appId: "1:19728474877:web:f86e3069a4927c3beb9494",
  measurementId: "G-TBG7D2XYGV"
};

// Create a secondary app instance with a unique name
const secondaryApp = !getApps().some(app => app.name === "SecondaryAuth")
  ? initializeApp(paytapConfig, "SecondaryAuth")
  : getApp("SecondaryAuth");

// Get auth instance from secondary app
export const secondaryAuth = getAuth(secondaryApp);

// Note: This secondary auth won't interfere with your main auth session
// You can create users here without affecting the logged-in admin