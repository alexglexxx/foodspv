import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getFirestore,
} from "firebase-admin/firestore";

// ========================================
// FIREBASE ADMIN
// ========================================

const firebaseAdminConfig = {
  projectId:
    process.env
      .NEXT_PUBLIC_FIREBASE_PROJECT_ID,

  clientEmail:
    process.env
      .FIREBASE_CLIENT_EMAIL,

  privateKey:
    process.env
      .FIREBASE_PRIVATE_KEY
        ?.replace(/\\n/g, "\n"),
};

// ========================================
// INIT
// ========================================

const adminApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(
          firebaseAdminConfig
        ),
      });

// ========================================
// DB
// ========================================

const db =
  getFirestore(
    adminApp
  );

// ========================================
// EXPORTS
// ========================================

export { db };
