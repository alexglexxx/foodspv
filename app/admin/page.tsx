"use client";

export const dynamic = "force-dynamic";

import {
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";

import {
  db,
  auth,
} from "@/lib/firebase-client";

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
  X,
} from "lucide-react";

import { QRCodeSVG } from "qrcode.react";

// ========================================
// TYPES
// ========================================

type Pedido = {
  id: string;
  items: Array<{
    id: string;
    nombre: string;
    precio: number;
    cantidad: number;
  }>;
  total: number;
  estado:
    | "nuevo"
    | "en proceso"
    | "entregado"
    | "cancelado";

  nombreCliente?: string;
  telefonoCliente?: string;

  createdAt: {
    toDate?: () => Date;
  } | null;
};

// ========================================
// PAGE
// ========================================

export default function AdminDashboard() {
  const [pedidos, setPedidos] =
    useState<Pedido[]>([]);

  const [tenantId, setTenantId] =
    useState<string | null>(null);

  const [tenantName, setTenantName] =
    useState("Tu Menú");

  const [loading, setLoading] =
    useState(true);

  const [activeFilter, setActiveFilter] =
    useState("pendientes");

  const [isQrModalOpen, setIsQrModalOpen] =
    useState(false);

  const [qrUrl, setQrUrl] =
    useState("");

  // ========================================
  // INIT
  // ========================================

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        async (user) => {
          try {
            if (!user) {
              setLoading(false);
              return;
            }

            const userDoc =
              await getDoc(
                doc(
                  db,
                  "users",
                  user.uid
                )
              );

            if (!userDoc.exists()) {
              setLoading(false);
              return;
            }

            const data =
              userDoc.data();

            const tid =
              data.tenantId;

            if (!tid) {
              setLoading(false);
              return;
            }

            setTenantId(tid);

            // SAFE WINDOW ACCESS
            if (
              typeof window !==
              "undefined"
            ) {
              setQrUrl(
                `${window.location.origin}/${tid}`
              );
            }

            // ========================================
            // TENANT
            // ========================================

            const tenantDoc =
              await getDoc(
                doc(
                  db,
                  "tenants",
                  tid
                )
              );

            if (
              tenantDoc.exists()
            ) {
              setTenantName(
                tenantDoc.data()
                  .name ||
                  "Tu Menú"
              );
            }

            // ========================================
            // ORDERS
            // ========================================

            const q = query(
              collection(
                db,
                "tenants",
                tid,
                "orders"
              ),
              orderBy(
                "createdAt",
                "desc"
              )
            );

            const unsubscribeOrders =
              onSnapshot(
                q,
                (snap) => {
                  const lista =
                    snap.docs.map(
                      (d) => {
                        const data =
                          d.data() as any;

                        return {
                          id: d.id,
                          items:
                            data.items ||
                            [],
                          total:
                            data.total ||
                            0,
                          estado:
                            data.estado ||
                            "nuevo",
                          nombreCliente:
                            data.nombreCliente ||
                            "",
                          telefonoCliente:
                            data.telefonoCliente ||
                            "",
                          createdAt:
                            data.createdAt ||
                            null,
                        };
                      }
                    );

                  setPedidos(
                    lista
                  );

                  setLoading(
                    false
                  );
                }
              );

            return () =>
              unsubscribeOrders();
          } catch (error) {
            console.error(
              "ADMIN INIT ERROR:",
              error
            );

            setLoading(false);
          }
        }
      );

    return () =>
      unsubscribeAuth();
  }, []);

  // ========================================
  // UPDATE STATUS
  // ========================================

  async function actualizarEstado(
    id: string,
    nuevoEstado: string
  ) {
    if (!tenantId || !db) return;

    try {
      await updateDoc(
        doc(
          db,
          "tenants",
          tenantId,
          "orders",
          id
        ),
        {
          estado:
            nuevoEstado,
        }
      );
    } catch (error) {
      console.error(error);
    }
  }

  // ========================================
  // FILTER
  // ========================================

  const pedidosFiltrados =
    pedidos.filter((p) => {
      if (
        activeFilter ===
        "pendientes"
      ) {
        return (
          p.estado !==
            "entregado" &&
          p.estado !==
            "cancelado"
        );
      }

      return (
        p.estado ===
          "entregado" ||
        p.estado ===
          "cancelado"
      );
    });

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Cargando panel...
      </div>
    );
  }

  // ========================================
  // NO TENANT
  // ========================================

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Restaurante no asignado.
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <ProtectedRoute allowedRole="admin">
      <main className="min-h-screen bg-zinc-950 text-white p-6">
        <h1 className="text-4xl font-bold mb-10">
          Panel Admin
        </h1>

        <div className="space-y-4">
          {pedidosFiltrados.map(
            (pedido) => (
              <div
                key={pedido.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
              >
                <div className="flex justify-between">
                  <div>
                    <h2 className="font-bold">
                      Pedido #
                      {pedido.id.slice(
                        -6
                      )}
                    </h2>

                    <p className="text-zinc-400">
                      {
                        pedido.nombreCliente
                      }
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-green-500">
                      $
                      {pedido.total.toFixed(
                        2
                      )}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {
                        pedido.estado
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() =>
                      actualizarEstado(
                        pedido.id,
                        "en proceso"
                      )
                    }
                    className="bg-orange-500 px-4 py-2 rounded-xl text-black font-bold"
                  >
                    Cocinar
                  </button>

                  <button
                    onClick={() =>
                      actualizarEstado(
                        pedido.id,
                        "entregado"
                      )
                    }
                    className="bg-green-500 px-4 py-2 rounded-xl text-black font-bold"
                  >
                    Entregar
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
