import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();
const db = admin.firestore();

// 🔐 Secrets (Gen2)
const WHATSAPP_TOKEN = defineSecret("WHATSAPP_TOKEN");
const WHATSAPP_PHONE_ID = defineSecret("WHATSAPP_PHONE_ID");

// 🚀 1. NEXT.JS SSR (Carga el servidor generado en modo standalone)
const nextServer = require("./server");

export const nextApp = onRequest(
  {
    region: "us-central1",
    memory: "1GiB", // 1GB necesario para que el SSR de Next.js funcione fluido
    minInstances: 1,
  },
  (req, res) => {
    return nextServer.handler(req, res);
  }
);

// 📩 2. NOTIFICACIÓN WHATSAPP (Gen2)
export const notifyOrder = onDocumentCreated(
  {
    document: "tenants/{tenantId}/orders/{orderId}",
    region: "us-central1",
    secrets: [WHATSAPP_TOKEN, WHATSAPP_PHONE_ID],
    memory: "256MiB",
  },
  async (event) => {
    try {
      const pedido = event.data?.data();
      const { tenantId, orderId: _orderId } = event.params;

      if (!pedido) {
        console.warn("[WARN] Orden vacía");
        return;
      }

      const tenantDoc = await db.doc(`tenants/${tenantId}`).get();
      const tenantData = tenantDoc.data();
      const notifyPhone = tenantData?.notifyPhone;

      if (!notifyPhone) {
        console.log(`[INFO] Tenant ${tenantId} sin teléfono`);
        return;
      }

      const items = pedido.items
        .map((i: any) => `• ${i.cantidad}x ${i.nombre} ($${(i.precio * i.cantidad).toFixed(2)})`)
        .join("\n");

      const mensaje = `🍔 *NUEVO PEDIDO* 🍔
--------------------------
👤 *Cliente:* ${pedido.cliente?.nombre || "N/A"}
📞 *Teléfono:* ${pedido.cliente?.telefono || "N/A"}
--------------------------
📝 *Detalle:*
${items}

💰 *TOTAL:* $${pedido.total.toFixed(2)}
--------------------------
_Enviado desde FoodSPV_`;

      await axios.post(
        `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_ID.value()}/messages`,
        {
          messaging_product: "whatsapp",
          to: notifyPhone,
          type: "text",
          text: { body: mensaje },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN.value()}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("[SUCCESS] WhatsApp enviado");
    } catch (error: any) {
      console.error("[ERROR] WhatsApp:", error.message);
    }
  }
);
