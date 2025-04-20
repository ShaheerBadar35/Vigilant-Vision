// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0sCImP1-39AERcog_JcUJvB0k5RGBTgg",
  authDomain: "vigilantvision-2e70b.firebaseapp.com",
  projectId: "vigilantvision-2e70b",
  storageBucket: "vigilantvision-2e70b.firebasestorage.app",
  messagingSenderId: "806257155936",
  appId: "1:806257155936:web:bd408b35de2958397b8805",
  measurementId: "G-GTE1L0V08F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
