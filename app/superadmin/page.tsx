"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const auth = getAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);
      console.log("1. Intentando login...");

      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log("2. Login OK:", cred.user.uid);

      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      console.log("3. userDoc exists:", userDoc.exists());

      if (!userDoc.exists()) {
        alert("Usuario no registrado");
        return;
      }

      const userData = userDoc.data();
      console.log("4. userData:", userData);

      if (userData.role !== "superadmin") {
        alert("No tienes acceso");
        return;
      }

      console.log("5. Redirigiendo...");
      router.push("/superadmin/dashboard");
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      alert("Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">
          👑 Superadmin Login
        </h1>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-zinc-800 border border-zinc-700"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 rounded bg-zinc-800 border border-zinc-700"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 p-3 rounded font-bold"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </main>
  );
}
