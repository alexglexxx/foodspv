"use client";

import {
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/context/AuthContext";

// ========================================
// TYPES
// ========================================

type Props = {
  children: React.ReactNode;
  allowedRole: string;
};

// ========================================
// COMPONENT
// ========================================

export default function ProtectedRoute({
  children,
  allowedRole,
}: Props) {
  const router = useRouter();

  const {
    user,
    role,
    loading,
  } = useAuth();

  useEffect(() => {
    // ========================================
    // WAIT AUTH
    // ========================================

    if (loading) {
      return;
    }

    // ========================================
    // NO USER
    // ========================================

    if (!user) {
      router.replace("/login");
      return;
    }

    // ========================================
    // ROLE BLOCK
    // ========================================

    if (role !== allowedRole) {
      router.replace("/login");
    }
  }, [
    user,
    role,
    loading,
    allowedRole,
    router,
  ]);

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  // ========================================
  // BLOCK
  // ========================================

  if (!user || role !== allowedRole) {
    return null;
  }

  // ========================================
  // SUCCESS
  // ========================================

  return <>{children}</>;
}
