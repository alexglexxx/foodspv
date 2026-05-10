"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { 
  LayoutDashboard, 
  Store, 
  Utensils, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronRight,
  TrendingUp,
  BarChart3,
  Search,
  CheckCircle2,
  XCircle
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState("tenants");
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms state
  const [newTenant, setNewTenant] = useState({ name: "", notifyPhone: "", active: true });
  const [newProduct, setNewProduct] = useState({ nombre: "", precio: 0, descripcion: "", categoria: "Populares", imagenUrl: "" });

  const auth = getAuth();

  useEffect(() => {
    const unsubTenants = onSnapshot(collection(db, "tenants"), (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTenants(lista);
      calculateAnalytics(lista);
      setLoading(false);
    });

    return () => unsubTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      const unsubProducts = onSnapshot(collection(db, "tenants", selectedTenant.id, "menu"), (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubProducts();
    }
  }, [selectedTenant]);

  async function calculateAnalytics(tenantList: any[]) {
    const data = await Promise.all(tenantList.map(async (t) => {
      const ordersSnap = await getDocs(collection(db, "tenants", t.id, "orders"));
      return {
        name: t.name,
        orders: ordersSnap.size,
      };
    }));
    setAnalytics(data.sort((a, b) => b.orders - a.orders));
  }

  async function handleCreateTenant() {
    if (!newTenant.name || !newTenant.notifyPhone) return alert("Completa los campos");
    try {
      await addDoc(collection(db, "tenants"), {
        ...newTenant,
        createdAt: new Date(),
        ownerId: auth.currentUser?.uid
      });
      setNewTenant({ name: "", notifyPhone: "", active: true });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateProduct() {
    if (!selectedTenant || !newProduct.nombre) return alert("Selecciona un tenant y nombre");
    try {
      await addDoc(collection(db, "tenants", selectedTenant.id, "menu"), {
        ...newProduct,
        precio: Number(newProduct.precio)
      });
      setNewProduct({ nombre: "", precio: 0, descripcion: "", categoria: "Populares", imagenUrl: "" });
    } catch (e) {
      console.error(e);
    }
  }

  async function toggleTenantStatus(id: string, currentStatus: boolean) {
    await updateDoc(doc(db, "tenants", id), { active: !currentStatus });
  }

  async function deleteProduct(id: string) {
    if (confirm("¿Borrar producto?")) {
      await deleteDoc(doc(db, "tenants", selectedTenant.id, "menu", id));
    }
  }

  return (
    <ProtectedRoute allowedRole="superadmin">
      <div className="min-h-screen bg-zinc-950 text-white flex">
        {/* Sidebar */}
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col gap-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl tracking-tight">FoodSPV</span>
          </div>

          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab("tenants")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "tenants" ? "bg-green-500 text-black font-bold shadow-[0_0_20px_rgba(34,197,94,0.2)]" : "text-zinc-400 hover:bg-zinc-800"}`}
            >
              <Store className="w-5 h-5" />
              Tenants
            </button>
            <button 
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "products" ? "bg-green-500 text-black font-bold shadow-[0_0_20px_rgba(34,197,94,0.2)]" : "text-zinc-400 hover:bg-zinc-800"}`}
            >
              <Utensils className="w-5 h-5" />
              Productos
            </button>
            <button 
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "analytics" ? "bg-green-500 text-black font-bold shadow-[0_0_20px_rgba(34,197,94,0.2)]" : "text-zinc-400 hover:bg-zinc-800"}`}
            >
              <BarChart3 className="w-5 h-5" />
              Métricas
            </button>
          </nav>

          <div className="mt-auto">
            <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
              <p className="text-xs text-zinc-500 mb-1">Usuario</p>
              <p className="text-sm font-medium truncate">{auth.currentUser?.email}</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === "tenants" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Gestión de Restaurantes</h1>
                  <p className="text-zinc-400 mt-1">Administra los negocios activos en la plataforma.</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl flex gap-1">
                  <div className="px-4 py-2 bg-zinc-800 rounded-lg text-sm font-medium">Todos: {tenants.length}</div>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-fit sticky top-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-green-500" />
                    Nuevo Tenant
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-zinc-400 mb-1.5 block">Nombre del Negocio</label>
                      <input 
                        type="text" 
                        value={newTenant.name}
                        onChange={e => setNewTenant({...newTenant, name: e.target.value})}
                        placeholder="Ej: Burger King"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-green-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 mb-1.5 block">WhatsApp Notificaciones</label>
                      <input 
                        type="text" 
                        value={newTenant.notifyPhone}
                        onChange={e => setNewTenant({...newTenant, notifyPhone: e.target.value})}
                        placeholder="+52..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-green-500 transition-colors"
                      />
                    </div>
                    <button 
                      onClick={handleCreateTenant}
                      className="w-full bg-green-500 text-black font-bold py-3 rounded-xl hover:bg-green-400 transition-all mt-4"
                    >
                      Crear Negocio
                    </button>
                  </div>
                </div>

                {/* Lista */}
                <div className="lg:col-span-2 space-y-4">
                  {tenants.map(t => (
                    <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between group hover:border-zinc-700 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-xl font-bold text-zinc-500">
                          {t.name[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{t.name}</h3>
                          <p className="text-zinc-500 text-sm">{t.notifyPhone} • {t.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleTenantStatus(t.id, t.active)}
                          className={`p-2 rounded-lg border transition-colors ${t.active ? "border-green-500/20 text-green-500 hover:bg-green-500/10" : "border-red-500/20 text-red-500 hover:bg-red-500/10"}`}
                        >
                          {t.active ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => { setSelectedTenant(t); setActiveTab("products"); }}
                          className="p-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Gestión de Productos</h1>
                  <p className="text-zinc-400 mt-1">Configura el menú para cada restaurante.</p>
                </div>
                <select 
                  className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none"
                  value={selectedTenant?.id || ""}
                  onChange={(e) => setSelectedTenant(tenants.find(t => t.id === e.target.value))}
                >
                  <option value="">Selecciona un restaurante...</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </header>

              {!selectedTenant ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-20 text-center">
                  <Utensils className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500">Selecciona un restaurante para gestionar su menú.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Formulario Producto */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-fit sticky top-8">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-green-500" />
                      Nuevo Producto
                    </h2>
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="Nombre del plato"
                        value={newProduct.nombre}
                        onChange={e => setNewProduct({...newProduct, nombre: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3"
                      />
                      <input 
                        type="number" 
                        placeholder="Precio"
                        value={newProduct.precio || ""}
                        onChange={e => setNewProduct({...newProduct, precio: Number(e.target.value)})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3"
                      />
                      <textarea 
                        placeholder="Descripción"
                        value={newProduct.descripcion}
                        onChange={e => setNewProduct({...newProduct, descripcion: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 h-24"
                      />
                      <input 
                        type="text" 
                        placeholder="Categoría (Ej: Postres)"
                        value={newProduct.categoria}
                        onChange={e => setNewProduct({...newProduct, categoria: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3"
                      />
                      <button 
                        onClick={handleCreateProduct}
                        className="w-full bg-green-500 text-black font-bold py-3 rounded-xl hover:bg-green-400 mt-4"
                      >
                        Agregar al Menú
                      </button>
                    </div>
                  </div>

                  {/* Lista Productos */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map(p => (
                      <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-4 group">
                        <div className="w-20 h-20 bg-zinc-800 rounded-xl shrink-0 overflow-hidden">
                          {p.imagenUrl ? <img src={p.imagenUrl} className="w-full h-full object-cover" /> : <Utensils className="w-6 h-6 text-zinc-700 m-7" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold">{p.nombre}</h4>
                            <button onClick={() => deleteProduct(p.id)} className="text-zinc-600 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <p className="text-xs text-zinc-500 line-clamp-1">{p.descripcion}</p>
                          <p className="text-green-500 font-bold mt-2">${p.precio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="mb-8">
                <h1 className="text-3xl font-bold">Métricas Globales</h1>
                <p className="text-zinc-400 mt-1">Ranking de pedidos por restaurante.</p>
              </header>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <div className="space-y-8">
                  {analytics.map((item, idx) => {
                    const maxOrders = analytics[0]?.orders || 1;
                    const percentage = (item.orders / maxOrders) * 100;
                    
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>{item.name}</span>
                          <span className="text-green-500">{item.orders} pedidos</span>
                        </div>
                        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                  <p className="text-zinc-500 text-sm mb-1">Total Negocios</p>
                  <p className="text-4xl font-bold">{tenants.length}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl border-l-4 border-l-green-500">
                  <p className="text-zinc-500 text-sm mb-1">Total Pedidos</p>
                  <p className="text-4xl font-bold">{analytics.reduce((acc, curr) => acc + curr.orders, 0)}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                  <p className="text-zinc-500 text-sm mb-1">Negocio Top</p>
                  <p className="text-2xl font-bold truncate">{analytics[0]?.name || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
