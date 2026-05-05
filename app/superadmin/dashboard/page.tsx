"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

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

    // 🔐 Obtener rol
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      alert("Usuario no registrado");
      return;
    }

    const userData = userDoc.data();

    if (userData.role !== "superadmin") {
      alert("No tienes acceso");
      return;
    }

    setAuthorized(true);
    await cargarTenants();
    setLoading(false);
  }

  async function cargarTenants() {
    const snap = await getDocs(collection(db, "tenants"));
    const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setTenants(lista);
  }

  async function crearTenant() {
    const user = auth.currentUser;

    if (!nuevoNombre || !nuevoTelefono) {
      alert("Completa nombre y teléfono");
      return;
    }

    await addDoc(collection(db, "tenants"), {
      name: nuevoNombre,
      notifyPhone: nuevoTelefono,
      active: activo,
      ownerId: user?.uid, // 🔥 importante
      createdAt: new Date(),
    });

    setNuevoNombre("");
    setNuevoTelefono("");
    setActivo(true);

    await cargarTenants();
  }

  // 🔄 loading
  if (loading) {
    return <p className="p-10">Cargando...</p>;
  }

  // 🔐 protección
  if (!authorized) {
    return <p className="p-10 text-red-500">Acceso denegado</p>;
  }

  return (
    <main className="p-10 min-h-screen bg-gray-100 text-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">
        👑 Superadmin - Tenants
      </h1>

      {/* Crear tenant */}
      <div className="mb-10 p-6 bg-white rounded shadow-md">
        <h2 className="text-xl mb-3 font-semibold">
          Crear nuevo tenant
        </h2>

        <input
          type="text"
          placeholder="Nombre del negocio"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          className="p-2 mb-3 w-full border rounded"
        />

        <input
          type="text"
          placeholder="WhatsApp (+52...)"
          value={nuevoTelefono}
          onChange={(e) => setNuevoTelefono(e.target.value)}
          className="p-2 mb-3 w-full border rounded"
        />

        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
          />
          Activo
        </label>

        <button
          onClick={crearTenant}
          className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded text-white"
        >
          Crear Tenant
        </button>
      </div>

      {/* Lista */}
      {tenants.map((t) => (
        <div key={t.id} className="mb-6 p-4 bg-white rounded shadow">
          <h2 className="font-semibold">
            {t.name} ({t.id})
          </h2>

          <p>📞 {t.notifyPhone}</p>
          <p>Estado: {t.active ? "✅ Activo" : "❌ Inactivo"}</p>
        </div>
      ))}
    </main>
  );
}
