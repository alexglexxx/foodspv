"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "@/lib/firebase-client";

// ========================================
// TYPES
// ========================================

type AuthContextType = {
  user: User | null;
  role: string | null;
  loading: boolean;
};

// ========================================
// CONTEXT
// ========================================

const AuthContext =
  createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
  });

// ========================================
// PROVIDER
// ========================================

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [role, setRole] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    // ========================================
    // SSR SAFETY
    // ========================================

    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          if (!firebaseUser) {
            setUser(null);
            setRole(null);
            setLoading(false);
            return;
          }

          setUser(firebaseUser);

          try {
            const userRef = doc(
              db,
              "users",
              firebaseUser.uid
            );

            const userSnap =
              await getDoc(userRef);

            if (userSnap.exists()) {
              const data =
                userSnap.data();

              setRole(data.role || null);
            }
          } catch (error) {
            console.error(
              "AUTH CONTEXT ERROR:",
              error
            );
          }

          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ========================================
// HOOK
// ========================================

export function useAuth() {
  return useContext(AuthContext);
}
