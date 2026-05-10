import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validar que tengamos la configuración mínima para inicializar
const isConfigValid = !!firebaseConfig.apiKey;

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (isConfigValid) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  // Durante el build de Next.js, si no hay variables de entorno,
  // inicializamos con valores dummy o dejamos que falle solo al usarlo.
  // Esto evita que 'next build' falle al importar este archivo.
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn("⚠️ Firebase config is missing. This is expected during some build phases if secrets are not available.");
  }
}

export { app, db, auth };
