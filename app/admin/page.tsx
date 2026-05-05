"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

type Pedido = {
  id: string;
  items: any[];
  total: number;
  estado: string;
};

export default function AdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const user = auth.currentUser;

    if (!user) {
      alert("No autenticado");
      return;
    }

    // 🔐 Obtener datos del usuario
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      alert("Usuario no encontrado");
      return;
    }

    const userData = userDoc.data();

    if (!userData.tenantId) {
      alert("No tienes tenant asignado");
      return;
    }

    setTenantId(userData.tenantId);

    await cargarPedidos(userData.tenantId);

    setLoading(false);
  }

  async function cargarPedidos(tenantId: string) {
    const snap = await getDocs(
      collection(db, "tenants", tenantId, "orders")
    );

    const lista = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Pedido[];

    setPedidos(lista);
  }

  async function actualizarEstado(id: string, nuevoEstado: string) {
    if (!tenantId) return;

    await updateDoc(
      doc(db, "tenants", tenantId, "orders", id),
      { estado: nuevoEstado }
    );

    await cargarPedidos(tenantId);
  }

  if (loading) {
    return <p className="p-10">Cargando...</p>;
  }

  return (
    <main className="p-10 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">
        📦 Panel Admin (Tenant)
      </h1>

      {pedidos.length === 0 && (
        <p className="text-gray-400">No hay pedidos aún</p>
      )}

      <table className="w-full border border-gray-700">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Items</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Estado</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id}>
              <td className="border p-2">{p.id}</td>

              <td className="border p-2">
                {p.items?.map((i: any, idx: number) => (
                  <div key={idx}>
                    {i.nombre} x {i.cantidad}
                  </div>
                ))}
              </td>

              <td className="border p-2">${p.total}</td>

              <td className="border p-2">{p.estado}</td>

              <td className="border p-2 flex gap-2">
                <button
                  onClick={() =>
                    actualizarEstado(p.id, "en proceso")
                  }
                  className="bg-yellow-500 px-3 py-1 rounded text-black"
                >
                  En proceso
                </button>

                <button
                  onClick={() =>
                    actualizarEstado(p.id, "entregado")
                  }
                  className="bg-green-500 px-3 py-1 rounded text-black"
                >
                  Entregado
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
