"use client";

import { useEffect, useState } from "react";

import ProtectedRoute from "@/components/ProtectedRoute";

import { db } from "@/lib/firebase";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";

import { getAuth } from "firebase/auth";

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<any[]>([]);

  const [nuevoNombre, setNuevoNombre] = useState("");

  const [nuevoTelefono, setNuevoTelefono] = useState("");

  const [activo, setActivo] = useState(true);

  const [loading, setLoading] = useState(true);

  const auth = getAuth();

  useEffect(() => {
    cargarTenants();
  }, []);

  async function cargarTenants() {
    try {
      const snap = await getDocs(collection(db, "tenants"));

      const lista = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setTenants(lista);
    } catch (error) {
      console.error(error);
      alert("Error cargando tenants");
    } finally {
      setLoading(false);
    }
  }

  async function crearTenant() {
    try {
      const user = auth.currentUser;

      if (!nuevoNombre || !nuevoTelefono) {
        alert("Completa nombre y teléfono");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user!.uid));

      if (!userDoc.exists()) {
        alert("Usuario inválido");
        return;
      }

      await addDoc(collection(db, "tenants"), {
        name: nuevoNombre,
        notifyPhone: nuevoTelefono,
        active: activo,
        ownerId: user?.uid,
        createdAt: new Date(),
      });

      setNuevoNombre("");
      setNuevoTelefono("");
      setActivo(true);

      await cargarTenants();
    } catch (error) {
      console.error(error);
      alert("Error creando tenant");
    }
  }

  return (
    <ProtectedRoute allowedRole="superadmin">
      <main className="p-10 min-h-screen bg-gray-100 text-gray-900">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">
          👑 Superadmin - Tenants
        </h1>

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

        {loading ? (
          <p>Cargando tenants...</p>
        ) : (
          tenants.map((t) => (
            <div
              key={t.id}
              className="mb-6 p-4 bg-white rounded shadow"
            >
              <h2 className="font-semibold">
                {t.name} ({t.id})
              </h2>

              <p>📞 {t.notifyPhone}</p>

              <p>
                Estado:{" "}
                {t.active ? "✅ Activo" : "❌ Inactivo"}
              </p>
            </div>
          ))
        )}
      </main>
    </ProtectedRoute>
  );
}
