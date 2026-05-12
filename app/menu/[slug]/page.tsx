"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
};

type CarritoItem = Producto & {
  cantidad: number;
};

export default function Home() {
  const tenantId = "userData.tenantIdXS";

  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [loading, setLoading] = useState(false);

  // estados para popup
  const [showPopup, setShowPopup] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const isFormValid = nombre.trim().length > 0 && telefono.trim().length >= 10;
  

  useEffect(() => {
    cargarMenu();
  }, []);

  async function cargarMenu() {
    const snap = await getDocs(collection(db, "tenants", tenantId, "menu"));
    const lista = snap.docs.map((doc) => {
      const data: any = doc.data();
      return {
        id: doc.id,
        nombre: String(data.nombre || ""),
        precio: parseFloat(data.precio || 0),
      };
    });
    setProductos(lista);
  }

  function agregar(producto: Producto) {
    const existe = carrito.find((i) => i.id === producto.id);
    if (existe) {
      setCarrito(
        carrito.map((i) =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      );
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  }

  function aumentar(id: string) {
    setCarrito(
      carrito.map((i) =>
        i.id === id ? { ...i, cantidad: i.cantidad + 1 } : i
      )
    );
  }

  function disminuir(id: string) {
    setCarrito(
      carrito
        .map((i) =>
          i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i
        )
        .filter((i) => i.cantidad > 0)
    );
  }

  function eliminar(id: string) {
    setCarrito(carrito.filter((i) => i.id !== id));
  }

  async function enviarPedido() {
    if (!carrito.length) {
      alert("Agrega productos");
      return;
    }
    if (!nombre.trim() || !telefono.trim() || telefono.trim().length < 10) {
      alert("Ingresa nombre y teléfono válidos");
      return;
    }
    setLoading(true);
    try {
      const total = carrito.reduce(
        (sum, i) => sum + i.precio * i.cantidad,
        0
      );
      await addDoc(collection(db, "tenants", tenantId, "orders"), {
        clienteNombre: nombre,
        clienteTelefono: telefono,
        items: carrito,
        total,
        estado: "pendiente",
        createdAt: new Date(),
      });
      setMensajeExito("Pedido enviado 🚀");
      setTimeout(() => setMensajeExito(""), 3000);
      setCarrito([]);
      setConfirmar(false);
      setShowPopup(false);
      setNombre("");
      setTelefono("");
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  }

  return (
    <main className="p-10 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">🍔 FoodSPV</h1>

      <h2 className="text-xl mb-4">Menú</h2>
      <div className="flex flex-col gap-3">
        {productos.map((p) => (
          <button
            key={p.id}
            onClick={() => agregar(p)}
            className="bg-white text-black p-4 rounded font-semibold"
          >
            {p.nombre} - ${p.precio}
          </button>
        ))}
      </div>

      <h2 className="text-xl mt-8 mb-4">Carrito</h2>
      <ul className="space-y-3">
        {carrito.map((item) => (
          <li
            key={item.id}
            className="bg-gray-800 p-3 rounded flex justify-between items-center"
          >
            <div>
              <div>{item.nombre}</div>
              <div>
                ${item.precio} x {item.cantidad}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => disminuir(item.id)}
                className="bg-yellow-500 px-3 rounded"
              >
                -
              </button>
              <button
                onClick={() => aumentar(item.id)}
                className="bg-green-500 px-3 rounded"
              >
                +
              </button>
              <button
                onClick={() => eliminar(item.id)}
                className="bg-red-500 px-3 rounded"
              >
                X
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Botón que abre popup */}
      <button
        onClick={() => setShowPopup(true)}
        disabled={loading}
        className="mt-6 bg-green-500 text-black px-5 py-3 rounded font-bold"
      >
        {loading ? "Enviando..." : "Ordenar"}
      </button>

      {/* Popup para nombre y teléfono */}
      {showPopup && !confirmar && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-80 text-black">
            <h2 className="text-xl font-bold mb-4">Datos del cliente</h2>
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="border p-2 mb-3 w-full"
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="border p-2 mb-3 w-full"
            />
            <button
              onClick={() => setConfirmar(true)}
              disabled={!isFormValid}
              className={`bg-blue-500 text-white px-4 py-2 rounded font-bold w-full ${!isFormValid ? 'opacity-50 pointer-events-none' : ''}`}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Pantalla de confirmación */}
      {showPopup && confirmar && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-96 text-black">
            <h2 className="text-2xl font-bold mb-4">Confirmar Pedido</h2>
            <ul className="mb-4">
              {carrito.map((i) => (
                <li key={i.id} className="text-lg">
                  {i.nombre} x {i.cantidad} 👉 ${i.precio * i.cantidad}
                </li>
              ))}
            </ul>
            <div className="text-3xl font-bold mb-4">
              Total: ${carrito.reduce((sum, i) => sum + i.precio * i.cantidad, 0)}
            </div>
            <button
              onClick={enviarPedido}
              disabled={!isFormValid || loading}
              className={`bg-green-600 text-white px-5 py-3 rounded font-bold w-full ${(!isFormValid || loading) ? 'opacity-50 pointer-events-none' : ''}`}
            >
              Confirmar y Enviar 🚀
            </button>
          </div>
        </div>
        )}
        {mensajeExito && (
          <div className="fixed top-5 right-5 bg-green-600 text-white px-6 py-3 rounded shadow-lg font-bold">
            {mensajeExito}
            </div>
      		  )}
    </main>
  );
}
