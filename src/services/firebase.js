// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// TODO: Add your Web App's Firebase Configuration
// -----------------------------------------------------------------
// PASTE YOUR firebaseConfig OBJECT FROM THE FIREBASE CONSOLE HERE
// -----------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBsa4EXmMMdQjMccbG17wBPMd9iQsb4KJY",
  authDomain: "codecollab-51e34.firebaseapp.com",
  projectId: "codecollab-51e34",
  storageBucket: "codecollab-51e34.firebasestorage.app",
  messagingSenderId: "843472885618",
  appId: "1:843472885618:web:39e387dd0fdc16c5ff6feb",
  measurementId: "G-4L8MQFL4GT",
  // Note: databaseURL is needed for Realtime Database
  databaseURL: "https://codecollab-51e34-default-rtdb.asia-southeast1.firebasedatabase.app/" // <-- Make sure to add this one
};
// -----------------------------------------------------------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize and export our Firebase services
// We will import these services in other parts of our app
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const db = getDatabase(app); // 'db' for Realtime Database

export default app;