"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  db,
  auth,
} from "@/lib/firebase-client";

// ========================================
// TYPES
// ========================================

interface Props {
  children: ReactNode;
}

// ========================================
// COMPONENT
// ========================================

export default function SuperAdminGuard({
  children,
}: Props) {
  const router = useRouter();

  const [authorized, setAuthorized] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    // ========================================
    // FIREBASE SAFETY
    // ========================================

    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            // ========================================
            // NO USER
            // ========================================

            if (!user) {
              setAuthorized(false);

              router.replace(
                "/superadmin"
              );

              return;
            }

            // ========================================
            // GET USER DOC
            // ========================================

            const userRef = doc(
              db,
              "users",
              user.uid
            );

            const userSnap =
              await getDoc(userRef);

            // ========================================
            // USER NOT FOUND
            // ========================================

            if (!userSnap.exists()) {
              setAuthorized(false);

              router.replace(
                "/superadmin"
              );

              return;
            }

            const data =
              userSnap.data();

            // ========================================
            // ROLE CHECK
            // ========================================

            if (
              data.role !==
              "superadmin"
            ) {
              setAuthorized(false);

              router.replace(
                "/superadmin"
              );

              return;
            }

            // ========================================
            // SUCCESS
            // ========================================

            setAuthorized(true);
          } catch (error) {
            console.error(
              "SUPER ADMIN GUARD ERROR:",
              error
            );

            setAuthorized(false);

            router.replace(
              "/superadmin"
            );
          } finally {
            setLoading(false);
          }
        }
      );

    return () => unsubscribe();
  }, [router]);

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Verificando acceso...
      </div>
    );
  }

  // ========================================
  // BLOCK
  // ========================================

  if (!authorized) {
    return null;
  }

  // ========================================
  // SUCCESS
  // ========================================

  return <>{children}</>;
}
