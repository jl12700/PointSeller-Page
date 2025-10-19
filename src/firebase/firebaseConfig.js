import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBZNYRzwEpTL1N6kkClqG5skv5DBw7RhC4",
  authDomain: "paytap-thesis.firebaseapp.com",
  projectId: "paytap-thesis",
  storageBucket: "paytap-thesis.firebasestorage.app",
  messagingSenderId: "19728474877",
  appId: "1:19728474877:web:f86e3069a4927c3beb9494",
  measurementId: "G-TBG7D2XYGV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);