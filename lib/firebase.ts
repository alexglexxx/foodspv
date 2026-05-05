// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
 
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0ys3AQvcwStU_WX_XhofMhSmOhCvwV_k",
  authDomain: "foodspv-14829.firebaseapp.com",
  projectId: "foodspv-14829",
  storageBucket: "foodspv-14829.firebasestorage.app",
  messagingSenderId: "44869038768",
  appId: "1:44869038768:web:c0dc9b1da1b20a48d68175"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
