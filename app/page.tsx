import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-3xl text-center">
        <h1 className="text-6xl font-bold mb-6">🍔 FoodSPV</h1>

        <p className="text-xl text-zinc-300 mb-10">
          Plataforma inteligente para restaurantes, pedidos y operación digital.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/menu/demo"
            className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-semibold"
          >
            Ver menú demo
          </Link>

          <Link
            href="/superadmin"
            className="bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-lg font-semibold"
          >
            Acceso administración
          </Link>
        </div>
      </div>
    </main>
  );
}
