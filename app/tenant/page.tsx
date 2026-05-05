"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { useParams } from "next/navigation";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
};

type CarritoItem = Producto & {
  cantidad: number;
};

export default function TenantPage() {
  const params = useParams();
  const tenantId = params.tenant as string;

  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);

  useEffect(() => {
    if (tenantId) cargarMenu();
  }, [tenantId]);

  async function cargarMenu() {
    const snap = await getDocs(
      collection(db, "tenants", tenantId, "products")
    );

    const lista = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Producto[];

    setProductos(lista);
  }

  function agregar(producto: Producto) {
    const existe = carrito.find((i) => i.id === producto.id);

    if (existe) {
      setCarrito(
        carrito.map((i) =>
          i.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        )
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  }

  async function enviarPedido() {
    if (!carrito.length) return;

    const total = carrito.reduce(
      (sum, i) => sum + i.precio * i.cantidad,
      0
    );

    await addDoc(
      collection(db, "tenants", tenantId, "orders"),
      {
        items: carrito,
        total,
        estado: "pendiente",
        createdAt: new Date(),
      }
    );

    setCarrito([]);
  }

  return (
    <main className="p-6 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">
        🍔 {tenantId}
      </h1>

      <div className="grid gap-4">
        {productos.map((p) => (
          <div
            key={p.id}
            className="bg-white text-black p-4 rounded"
          >
            <h2 className="font-bold">{p.nombre}</h2>
            <p>${p.precio}</p>

            <button
              onClick={() => agregar(p)}
              className="mt-2 bg-green-500 px-3 py-1 rounded"
            >
              Agregar
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={enviarPedido}
        className="mt-6 bg-blue-500 px-5 py-3 rounded"
      >
        Ordenar
      </button>
    </main>
  );
}
