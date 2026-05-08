import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";

import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD0ys3AQvcwStU_WX_XhofMhSmOhCvwV_k",
  authDomain: "foodspv-14829.firebaseapp.com",
  projectId: "foodspv-14829",
  storageBucket: "foodspv-14829.firebasestorage.app",
  messagingSenderId: "44869038768",
  appId: "1:44869038768:web:c0dc9b1da1b20a48d68175",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);
