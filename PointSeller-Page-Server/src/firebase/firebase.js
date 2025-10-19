// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZNYRzwEpTL1N6kkClqG5skv5DBw7RhC4",
  authDomain: "paytap-thesis.firebaseapp.com",
  projectId: "paytap-thesis",
  storageBucket: "paytap-thesis.firebasestorage.app",
  messagingSenderId: "19728474877",
  appId: "1:19728474877:web:f86e3069a4927c3beb9494",
  measurementId: "G-TBG7D2XYGV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const storage = getStorage(app)

export const db=getFirestore(app);
export{app, auth,};