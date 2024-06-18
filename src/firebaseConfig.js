// Import the functions you need from the SDKs you need
// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCCZ6h0uL6SqHy2kZGbmg5X58VwOtSfu6s",
  authDomain: "tomkhot-bahava.firebaseapp.com",
  projectId: "tomkhot-bahava",
  storageBucket: "tomkhot-bahava.appspot.com",
  messagingSenderId: "592102246361",
  appId: "1:592102246361:web:9519ac2800be300aae7bc8",
  measurementId: "G-2TC806TLZJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
export { db, auth };
