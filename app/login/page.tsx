import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Utensils } from "lucide-react";

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
      if (!auth || !db) throw new Error("Firebase no inicializado");
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || password.length < 6) {
        setError("Datos inválidos. La contraseña debe tener al menos 6 caracteres.");
        setLoading(false);
        return;
      }

      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const uid = userCred.user.uid;
      const userDoc = await getDoc(doc(db, "users", uid));

      if (!userDoc.exists()) {
        setError("Usuario no encontrado en la base de datos.");
        setLoading(false);
        return;
      }

      const data = userDoc.data();
      const role = data.role;
      const tenantId = data.tenantId;

      switch (role) {
        case "superadmin":
          router.push("/superadmin/dashboard");
          break;
        case "admin":
        case "tenant_admin":
          router.push("/admin");
          break;
        default:
          setError("Rol de usuario inválido o sin permisos.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Credenciales incorrectas o error de conexión.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-green-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-zinc-950 to-zinc-950"></div>
      
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.15)]">
            <Utensils className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Acceso a FoodSPV</h1>
          <p className="text-zinc-400 mt-2 text-sm">Ingresa con tus credenciales de administrador.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-zinc-900/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-zinc-800/50">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block font-medium">Correo Electrónico</label>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-zinc-700"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1.5 block font-medium">Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-zinc-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 active:scale-[0.98] text-black font-bold py-3.5 rounded-xl transition-all mt-8 shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
