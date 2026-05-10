"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

type Props = {
  children: React.ReactNode;
  allowedRole: string;
};

export default function ProtectedRoute({
  children,
  allowedRole,
}: Props) {
  const router = useRouter();

  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (role !== allowedRole) {
      router.push("/login");
    }
  }, [user, role, loading, allowedRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!user || role !== allowedRole) {
    return null;
  }

  return <>{children}</>;
}
