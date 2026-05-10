"use client";

import React, { useState } from "react";
import { useCart } from "@/context/CartContext";
import { X, Minus, Plus, ShoppingBag, Loader2, Store, CheckCircle2, AlertCircle, MapPin, Phone, DollarSign } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type CartModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantPhone?: string;
};

export default function CartModal({ isOpen, onClose, tenantId, tenantPhone }: CartModalProps) {
  const { items, addItem, removeItem, totalPrice, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState<"idle" | "success" | "error">("idle");
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"pickup" | "stripe">("pickup");

  if (!isOpen) return null;

  const handleConfirmOrder = async () => {
    if (!nombreCliente.trim() || !telefonoCliente.trim()) {
      setErrorMsg("Completa todos los campos para continuar.");
      return;
    }
    if (telefonoCliente.length < 10) {
      setErrorMsg("Ingresa un teléfono válido.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (paymentMethod === "stripe") {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            tenantId,
            customerName: nombreCliente,
            customerPhone: telefonoCliente,
          }),
        });

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url; // Redirect to Stripe
          return;
        } else {
          throw new Error(data.error || "Error al crear sesión de pago");
        }
      }

      const orderData = {
        nombreCliente: nombreCliente.trim(),
        telefonoCliente: telefonoCliente.trim(),
        items: items.map(i => ({
          id: i.id,
          nombre: i.nombre,
          precio: i.precio,
          cantidad: i.cantidad
        })),
        total: totalPrice,
        createdAt: serverTimestamp(),
        estado: "nuevo", // "nuevo" triggers the green badge in the Admin Dashboard
        paymentMethod: "pickup",
      };

      await addDoc(collection(db, "tenants", tenantId, "orders"), orderData);
      
      setOrderStatus("success");
      clearCart();
      setTimeout(() => {
        onClose();
        setOrderStatus("idle");
        setNombreCliente("");
        setTelefonoCliente("");
      }, 4000);
    } catch (error: any) {
      console.error("Error al procesar el pedido:", error);
      setErrorMsg(error.message || "Error al procesar el pedido");
      setOrderStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-[#0A0A0B] w-full max-w-lg rounded-t-[2rem] sm:rounded-3xl border border-zinc-800/50 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-10 duration-300 ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sleek Header */}
        <div className="px-6 py-5 border-b border-zinc-800/50 flex justify-between items-center bg-[#0A0A0B] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#121214] rounded-2xl flex items-center justify-center border border-zinc-800">
              <ShoppingBag className="w-5 h-5 text-zinc-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Checkout</h2>
              <p className="text-xs text-zinc-500 font-medium">{items.length} artículo(s)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-[#121214] hover:bg-zinc-800 border border-zinc-800 rounded-full transition-all active:scale-95"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 no-scrollbar bg-gradient-to-b from-[#0A0A0B] to-[#121214]">
          {orderStatus === "success" ? (
            <div className="py-16 flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse"></div>
                <div className="w-24 h-24 bg-green-500 rounded-[2rem] flex items-center justify-center rotate-3 relative shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                  <CheckCircle2 className="w-12 h-12 text-black -rotate-3" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">¡Orden Confirmada!</h3>
                <p className="text-zinc-400 mt-2 max-w-xs mx-auto">
                  Tu pedido ha sido enviado al restaurante. Por favor, pasa a recogerlo en breve.
                </p>
              </div>
            </div>
          ) : orderStatus === "error" ? (
            <div className="py-16 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center border border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Transacción Fallida</h3>
                <p className="text-zinc-400 mt-2">{errorMsg || "Ocurrió un error al procesar tu orden."}</p>
              </div>
              <button 
                onClick={() => setOrderStatus("idle")}
                className="px-6 py-3 bg-white text-black font-bold rounded-xl active:scale-95 transition-transform"
              >
                Intentar nuevamente
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center border border-zinc-800">
                <ShoppingBag className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-zinc-500 font-medium">Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              {/* Order Items List */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center gap-4 bg-[#121214] border border-zinc-800/50 p-4 rounded-2xl">
                    <div className="flex-1">
                      <h4 className="font-bold text-zinc-100 text-sm md:text-base leading-tight">{item.nombre}</h4>
                      <p className="text-xs text-zinc-500 mt-1">${item.precio.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-black px-2 py-1.5 rounded-xl border border-zinc-800">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="w-7 h-7 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center text-white">{item.cantidad}</span>
                      <button 
                        onClick={() => addItem(item)}
                        className="w-7 h-7 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right min-w-[4rem]">
                      <p className="font-bold text-white">${(item.precio * item.cantidad).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-4 bg-[#121214] border border-zinc-800/50 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Método de Pago</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPaymentMethod("pickup")}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === "pickup" ? "border-green-500 bg-green-500/10 text-white" : "border-zinc-800 bg-black text-zinc-500 hover:border-zinc-700"}`}
                  >
                    <Store className="w-6 h-6" />
                    <span className="text-xs font-bold">Pagar al recoger</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod("stripe")}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === "stripe" ? "border-blue-500 bg-blue-500/10 text-white" : "border-zinc-800 bg-black text-zinc-500 hover:border-zinc-700"}`}
                  >
                    <DollarSign className="w-6 h-6" />
                    <span className="text-xs font-bold">Tarjeta / Online</span>
                  </button>
                </div>
              </div>

              {/* Pickup Info Banner */}
              <div className="bg-[#121214] border border-zinc-800/50 rounded-2xl p-4 flex gap-4 items-start">
                <div className="p-2.5 bg-zinc-900 rounded-xl shrink-0 border border-zinc-800">
                  <MapPin className="w-5 h-5 text-zinc-300" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 text-sm">Recolección en Tienda</h4>
                  <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                    Este pedido es exclusivo para pasar a recoger. Te notificaremos cuando esté listo.
                  </p>
                </div>
              </div>

              {/* Customer Form */}
              <div className="bg-[#121214] border border-zinc-800/50 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">Datos del Cliente</h3>
                
                {errorMsg && (
                  <div className="mb-4 flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label htmlFor="nombre" className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wide">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-black border border-zinc-800 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-zinc-700 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="telefono" className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wide">
                      Teléfono Móvil
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="w-4 h-4 text-zinc-600" />
                      </div>
                      <input
                        type="tel"
                        id="telefono"
                        value={telefonoCliente}
                        onChange={(e) => setTelefonoCliente(e.target.value)}
                        placeholder="10 dígitos"
                        className="w-full bg-black border border-zinc-800 text-white rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-zinc-700 text-sm"
                        required
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer / Action Bar */}
        {items.length > 0 && orderStatus === "idle" && (
          <div className="p-6 border-t border-zinc-800/50 bg-[#0A0A0B] space-y-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-zinc-400 text-sm font-medium">Total a pagar</span>
              <span className="text-3xl font-black text-white tracking-tighter">${totalPrice.toFixed(2)}</span>
            </div>
            
            <button
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className={`w-full font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-xl ${paymentMethod === "stripe" ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-green-500 hover:bg-green-400 text-black"}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Procesando...
                </>
              ) : (
                paymentMethod === "stripe" ? "Pagar con Tarjeta" : "Confirmar Orden"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
