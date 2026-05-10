"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!auth || !db) throw new Error("Firebase not initialized");
      // 🔐 Sanitización básica
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || password.length < 6) {
        setError("Datos inválidos");
        setLoading(false);
        return;
      }

      // 🔐 Login
      const userCred = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const uid = userCred.user.uid;

      // 🔎 Obtener rol
      const userDoc = await getDoc(doc(db, "users", uid));

      if (!userDoc.exists()) {
        setError("Usuario sin configuración");
        setLoading(false);
        return;
      }

      const data = userDoc.data();
      const role = data.role;
      const tenantId = data.tenantId;

      // 🚦 Routing inteligente
      switch (role) {
        case "superadmin":
          router.push("/superadmin");
          break;

        case "tenant_admin":
          if (!tenantId) {
            setError("Tenant no asignado");
            break;
          }
          router.push("/admin");
          break;

        default:
          setError("Rol inválido");
      }
    } catch (err: any) {
      setError("Error de autenticación");
    }

    setLoading(false);
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Login
        </h1>

        {error && (
          <p className="text-red-500 mb-4 text-sm">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 mb-4 w-full rounded"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 mb-4 w-full rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full font-bold"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
