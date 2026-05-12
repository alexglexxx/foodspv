"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { db, auth } from "@/lib/firebase";

interface Props {
  children: ReactNode;
}

export default function SuperAdminGuard({ children }: Props) {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          router.push("/superadmin");
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          router.push("/superadmin");
          return;
        }

        const data = userSnap.data();

        if (data.role !== "superadmin") {
          router.push("/superadmin");
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error("AUTH GUARD ERROR:", error);
        router.push("/superadmin");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Verificando acceso...
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
