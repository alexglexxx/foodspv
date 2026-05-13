"use client";

import { useEffect, useState, use } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Star, Clock, Info, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import CartModal from "@/src/components/CartModal";

type MenuItem = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl?: string;
  categoria?: string;
};

type TenantInfo = {
  name: string;
  description: string;
  bannerUrl?: string;
  notifyPhone?: string;
  active?: boolean;
};

export default function TenantMenuPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = use(params);
  const [info, setInfo] = useState<TenantInfo | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addItem, totalItems, totalPrice } = useCart();

  useEffect(() => {
    async function fetchData() {
      try {
        const tenantDoc = await getDoc(doc(db, "tenants", tenant));
        if (tenantDoc.exists()) {
          const tenantData = tenantDoc.data();
          setInfo({
            name: tenantData.name || tenantData.nombre || tenant.charAt(0).toUpperCase() + tenant.slice(1),
            description:
              tenantData.description ||
              tenantData.descripcion ||
              "Descubre los mejores sabores locales entregados directamente a tu puerta.",
            bannerUrl: tenantData.bannerUrl,
            notifyPhone: tenantData.notifyPhone || tenantData.telefono,
            active: tenantData.active,
          });
        } else {
          setInfo({
            name: tenant.charAt(0).toUpperCase() + tenant.slice(1),
            description: "Descubre los mejores sabores locales entregados directamente a tu puerta.",
            bannerUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=2000&auto=format&fit=crop",
            notifyPhone: "521234567890",
            active: true,
          });
        }

        const menuSnap = await getDocs(collection(db, "tenants", tenant, "menu"));
        if (!menuSnap.empty) {
          const items = menuSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as MenuItem[];
          setMenu(items);
        } else {
          // Menú de prueba (Fallback visual)
          setMenu([
            { id: "1", nombre: "Hamburguesa Smash Clásica", descripcion: "Doble carne smash (180g), queso cheddar derretido, cebolla caramelizada y nuestra salsa secreta en pan brioche.", precio: 12.99, categoria: "Populares", imagenUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop" },
            { id: "2", nombre: "Papas Trufadas", descripcion: "Papas fritas crujientes bañadas en aceite de trufa blanca, espolvoreadas con queso parmesano y perejil fresco.", precio: 6.50, categoria: "Acompañamientos", imagenUrl: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&auto=format&fit=crop" },
            { id: "3", nombre: "Pizza Margarita Neapolitana", descripcion: "Masa madre de fermentación lenta, auténtico tomate San Marzano, mozzarella fior di latte y hojas de albahaca fresca.", precio: 14.50, categoria: "Populares", imagenUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop" },
            { id: "4", nombre: "Limonada de Jengibre", descripcion: "Refrescante bebida artesanal gasificada con un toque picante de jengibre natural y menta.", precio: 3.50, categoria: "Bebidas" },
            { id: "5", nombre: "Cheesecake de Frutos Rojos", descripcion: "Base de galleta crujiente con crema de queso suave y coulis de frutos del bosque casero.", precio: 5.90, categoria: "Postres", imagenUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop" }
          ]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tenant]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Agrupar menú por categoría
  const categorias = Array.from(new Set(menu.map((i) => i.categoria || "Otros")));

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 pb-32 font-sans selection:bg-green-500/30">
      {/* Hero Banner */}
      <div className="relative w-full h-64 md:h-80 bg-zinc-900">
        <img
          src={info?.bannerUrl}
          alt="Banner del restaurante"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
      </div>

      {/* Info Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-24">
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-2xl">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 text-white">
            {info?.name}
          </h1>
          <p className="text-zinc-400 text-sm md:text-base mb-5 max-w-2xl leading-relaxed">
            {info?.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <div className="flex items-center gap-1.5 text-zinc-200 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700/50">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>4.8 <span className="text-zinc-400 font-normal">(200+)</span></span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-200 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700/50">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span>25-35 min</span>
            </div>
            <button className="flex items-center gap-1.5 text-zinc-200 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700/50 hover:bg-zinc-700 transition">
              <Info className="w-4 h-4 text-zinc-400" />
              <span>Info</span>
            </button>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="mt-12 space-y-12">
          {categorias.map((cat) => (
            <section key={cat} className="scroll-mt-24" id={cat.toLowerCase().replace(/\s+/g, '-')}>
              <h2 className="text-2xl font-bold mb-6 tracking-tight text-white">{cat}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menu
                  .filter((item) => (item.categoria || "Otros") === cat)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="group flex justify-between bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-300 cursor-pointer overflow-hidden relative"
                    >
                      <div className="flex-1 pr-4 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-zinc-100 group-hover:text-white transition-colors">
                            {item.nombre}
                          </h3>
                          <p className="text-zinc-400 text-sm mt-1.5 line-clamp-2 leading-relaxed">
                            {item.descripcion}
                          </p>
                        </div>
                        <span className="mt-4 font-medium text-zinc-300">
                          ${item.precio.toFixed(2)}
                        </span>
                      </div>

                      <div className="relative w-32 h-32 shrink-0 bg-zinc-800 rounded-xl overflow-hidden">
                        {item.imagenUrl ? (
                          <img
                            src={item.imagenUrl}
                            alt={item.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <ShoppingBag className="w-8 h-8 opacity-20" />
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem({
                              id: item.id,
                              nombre: item.nombre,
                              precio: item.precio,
                              imagenUrl: item.imagenUrl
                            });
                          }}
                          className="absolute bottom-2 right-2 bg-white text-black p-2 rounded-full shadow-lg hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all"
                        >
                          <Plus className="w-4 h-4 font-bold" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Barra de carrito flotante */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 pointer-events-none z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="pointer-events-auto bg-green-500 hover:bg-green-400 text-black font-semibold py-4 px-8 rounded-full shadow-[0_0_40px_rgba(34,197,94,0.3)] flex items-center gap-3 transition-transform hover:scale-105 active:scale-95 w-full max-w-sm justify-between"
          >
            <div className="flex items-center gap-2 bg-black/10 px-3 py-1 rounded-full text-sm">
              <span className="font-bold">{totalItems}</span>
            </div>
            <span>Ver pedido</span>
            <span className="font-bold">${totalPrice.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modal del Carrito */}
      <CartModal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        tenantId={tenant}
      />
    </main>
  );
}
