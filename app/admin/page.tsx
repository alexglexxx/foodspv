"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import ProtectedRoute from "@/src/components/ProtectedRoute";
import { 
  Clock, 
  CheckCircle2, 
  Timer,
  DollarSign,
  Package,
  User,
  Phone,
  QrCode,
  X
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type Pedido = {
  id: string;
  items: Array<{
    id: string;
    nombre: string;
    precio: number;
    cantidad: number;
    subtotal?: number;
  }>;
  total: number;
  estado: "nuevo" | "en proceso" | "entregado" | "cancelado";
  nombreCliente?: string;
  telefonoCliente?: string;
  paymentMethod?: "pickup";
  source?: "public_menu";
  createdAt: {
    toDate?: () => Date;
  } | null;
};

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>("Tu Menú");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("pendientes");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    const init = async () => {
      const user = auth?.currentUser;
      if (!user || !db) return;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const tid = userDoc.data().tenantId;
        setTenantId(tid);
        
        if (tid) {
          // Set QR URL based on current origin and tenant ID
          setQrUrl(`${window.location.origin}/${tid}`);
          
          // Get Tenant Name for the QR modal
          const tenantDoc = await getDoc(doc(db, "tenants", tid));
          if(tenantDoc.exists()) {
            setTenantName(tenantDoc.data().name || "Tu Menú");
          }

          const q = query(
            collection(db, "tenants", tid, "orders"),
            orderBy("createdAt", "desc")
          );

          const unsub = onSnapshot(q, (snap) => {
            const lista = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Pedido[];
            setPedidos(lista);
            setLoading(false);
          });

          return () => unsub();
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    init();
  }, []);

  async function actualizarEstado(id: string, nuevoEstado: string) {
    if (!tenantId) return;
    try {
      await updateDoc(doc(db, "tenants", tenantId, "orders", id), {
        estado: nuevoEstado
      });
    } catch (e) {
      console.error(e);
    }
  }

  const pedidosFiltrados = pedidos.filter(p => {
    if (activeFilter === "pendientes") return p.estado !== "entregado" && p.estado !== "cancelado";
    return p.estado === "entregado" || p.estado === "cancelado";
  });

  const stats = {
    totalHoy: pedidos.filter(p => p.estado === "entregado").reduce((acc, curr) => acc + curr.total, 0),
    pendientes: pedidos.filter(p => p.estado !== "entregado" && p.estado !== "cancelado").length,
    completados: pedidos.filter(p => p.estado === "entregado").length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="text-center bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-2xl max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Restaurante no asignado</h2>
          <p className="text-zinc-400">
            Tu cuenta administrativa no tiene ningún restaurante vinculado. Por favor, contacta al soporte técnico.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRole="admin">
      <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-10">
        <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Panel de Control</h1>
            <p className="text-zinc-400 mt-1 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              Conectado en tiempo real
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Botón QR */}
            <button 
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-zinc-700 transition-all font-bold text-sm"
            >
              <QrCode className="w-5 h-5" />
              Mi Código QR
            </button>
            
            <div className="flex gap-1 p-1 bg-zinc-900 rounded-2xl border border-zinc-800">
              <button 
                onClick={() => setActiveFilter("pendientes")}
                className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeFilter === "pendientes" ? "bg-green-500 text-black shadow-lg shadow-green-500/20" : "text-zinc-400 hover:text-white"}`}
              >
                Pendientes
              </button>
              <button 
                onClick={() => setActiveFilter("entregados")}
                className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeFilter === "entregados" ? "bg-green-500 text-black shadow-lg shadow-green-500/20" : "text-zinc-400 hover:text-white"}`}
              >
                Historial
              </button>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="w-16 h-16" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">Total Entregado</p>
            <p className="text-4xl font-bold mt-1">${stats.totalHoy.toFixed(2)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group border-l-4 border-l-orange-500">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Timer className="w-16 h-16 text-orange-500" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">Pedidos en Curso</p>
            <p className="text-4xl font-bold mt-1 text-orange-500">{stats.pendientes}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl relative overflow-hidden group border-l-4 border-l-green-500">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">Completados Total</p>
            <p className="text-4xl font-bold mt-1 text-green-500">{stats.completados}</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="max-w-6xl mx-auto">
          {pedidosFiltrados.length === 0 ? (
            <div className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-[2rem] p-20 text-center">
              <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-lg">No hay pedidos en esta sección</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pedidosFiltrados.map((pedido) => (
                <div 
                  key={pedido.id}
                  className={`bg-zinc-900 border rounded-3xl p-6 flex flex-col md:flex-row gap-6 transition-all hover:border-zinc-700 ${pedido.estado === "nuevo" ? "border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.1)]" : "border-zinc-800"}`}
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          pedido.estado === "nuevo" ? "bg-green-500 text-black" :
                          pedido.estado === "en proceso" ? "bg-orange-500 text-black" :
                          "bg-zinc-800 text-zinc-400"
                        }`}>
                          {pedido.estado}
                        </span>
                        <h3 className="text-xl font-bold mt-2 font-mono">#{pedido.id.slice(-6).toUpperCase()}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">${pedido.total.toFixed(2)}</p>
                        <p className="text-xs text-zinc-500 mt-1 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {pedido.createdAt?.toDate ? new Date(pedido.createdAt.toDate()).toLocaleTimeString() : "Recién ahora"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {pedido.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/30">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-green-500/10 text-green-500 rounded flex items-center justify-center font-bold text-xs">{item.cantidad}</span>
                            <span className="text-zinc-200">{item.nombre}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-zinc-400 border-t border-zinc-800 pt-4">
                      <div className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                        <User className="w-3.5 h-3.5" />
                        <span>{pedido.nombreCliente || "Cliente Anónimo"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{pedido.telefonoCliente || "Sin teléfono"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-3 justify-center md:justify-start min-w-[160px]">
                    {pedido.estado === "nuevo" && (
                      <button 
                        onClick={() => actualizarEstado(pedido.id, "en proceso")}
                        className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <Timer className="w-5 h-5" />
                        Cocinar
                      </button>
                    )}
                    {pedido.estado === "en proceso" && (
                      <button 
                        onClick={() => actualizarEstado(pedido.id, "entregado")}
                        className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Entregar
                      </button>
                    )}
                    {(pedido.estado === "nuevo" || pedido.estado === "en proceso") && (
                      <button 
                        onClick={() => actualizarEstado(pedido.id, "cancelado")}
                        className="w-full bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-400 font-bold py-3 px-4 rounded-2xl transition-all active:scale-95"
                      >
                        Cancelar
                      </button>
                    )}
                    {pedido.estado === "entregado" && (
                      <div className="flex items-center justify-center gap-2 text-green-500 font-bold bg-green-500/10 py-3 rounded-2xl">
                        <CheckCircle2 className="w-5 h-5" />
                        Finalizado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full relative flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-green-500" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">Imprime tu Menú</h3>
            <p className="text-zinc-400 text-sm mb-8">
              Escanea este código para ver el menú de <strong>{tenantName}</strong>. Colócalo en tus mesas o mostrador.
            </p>

            <div className="bg-white p-4 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.15)] mb-6">
              <QRCodeSVG 
                value={qrUrl} 
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"Q"}
                includeMargin={false}
              />
            </div>
            
            <p className="text-xs font-mono text-zinc-500 bg-black px-3 py-2 rounded-lg w-full truncate border border-zinc-800">
              {qrUrl}
            </p>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
