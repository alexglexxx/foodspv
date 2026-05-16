"use client";

export const dynamic = "force-dynamic";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  Utensils,
} from "lucide-react";

import {
  auth,
  db,
} from "@/lib/firebase-client";

// ========================================
// PAGE
// ========================================

export default function LoginPage() {
  const router =
    useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ========================================
  // LOGIN
  // ========================================

  async function handleLogin(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // ========================================
      // SAFETY
      // ========================================

      if (!auth || !db) {
        throw new Error(
          "Firebase no inicializado"
        );
      }

      // ========================================
      // VALIDATION
      // ========================================

      const cleanEmail =
        email
          .trim()
          .toLowerCase();

      if (
        !cleanEmail ||
        password.length < 6
      ) {
        setError(
          "Datos inválidos."
        );

        setLoading(false);

        return;
      }

      // ========================================
      // AUTH
      // ========================================

      const userCred =
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const uid =
        userCred.user.uid;

      // ========================================
      // USER DOC
      // ========================================

      const userDoc =
        await getDoc(
          doc(
            db,
            "users",
            uid
          )
        );

      if (
        !userDoc.exists()
      ) {
        setError(
          "Usuario no encontrado."
        );

        setLoading(false);

        return;
      }

      const data =
        userDoc.data();

      const role =
        data.role;

      // ========================================
      // ROUTING
      // ========================================

      switch (role) {
        case "superadmin":
          router.push(
            "/superadmin/dashboard"
          );
          break;

        case "admin":
        case "tenant_admin":
          router.push(
            "/admin"
          );
          break;

        default:
          setError(
            "Sin permisos."
          );
      }
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setError(
        "Credenciales incorrectas."
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
        {/* ======================================== */}
        {/* HEADER */}
        {/* ======================================== */}

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20 mb-4">
            <Utensils className="w-8 h-8 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-white">
            FoodSPV
          </h1>

          <p className="text-zinc-400 mt-2 text-sm">
            Acceso administrativo
          </p>
        </div>

        {/* ======================================== */}
        {/* ERROR */}
        {/* ======================================== */}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4">
            {error}
          </div>
        )}

        {/* ======================================== */}
        {/* FORM */}
        {/* ======================================== */}

        <form
          onSubmit={
            handleLogin
          }
          className="space-y-5"
        >
          {/* EMAIL */}

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Correo
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder="correo@ejemplo.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
            />
          </div>

          {/* PASSWORD */}

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Contraseña
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="********"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500"
            />
          </div>

          {/* BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading
              ? "Ingresando..."
              : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </main>
  );
}
