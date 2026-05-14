"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/lib/firebase-client";
import { doc, getDoc } from "firebase/firestore";
import { ShieldCheck } from "lucide-react";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (!auth || !db) throw new Error("Firebase no inicializado");
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      
      if (!userDoc.exists() || userDoc.data().role !== "superadmin") {
        setError("Acceso denegado. No eres superadministrador.");
        setLoading(false);
        return;
      }
      router.push("/superadmin/dashboard");
    } catch {
      setError("Credenciales inválidas o falta de permisos.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-purple-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-zinc-950 to-zinc-950"></div>
      
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
            <ShieldCheck className="w-8 h-8 text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Portal SuperAdmin</h1>
          <p className="text-zinc-400 mt-2 text-sm">Acceso central a la infraestructura multi-tenant.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-zinc-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-zinc-800/50">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block font-medium">Correo</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none placeholder:text-zinc-700" 
                placeholder="admin@foodspv.com" 
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block font-medium">Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none placeholder:text-zinc-700" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all mt-8 shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 flex justify-center items-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : "Ingresar a la Consola"}
          </button>
        </form>
      </div>
    </main>
  );
}
