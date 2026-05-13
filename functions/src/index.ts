import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import axios from "axios";

admin.initializeApp();
const db = admin.firestore();

// 🔐 Secrets (Gen2)
const WHATSAPP_TOKEN = defineSecret("WHATSAPP_TOKEN");
const WHATSAPP_PHONE_ID = defineSecret("WHATSAPP_PHONE_ID");

// 📩 NOTIFICACIÓN WHATSAPP (Gen2)
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
      const tenantName = tenantData?.name || "Tu negocio";

      if (!notifyPhone) {
        console.log(`[INFO] Tenant ${tenantId} sin teléfono`);
        return;
      }

      const items = pedido.items
        .map((i: { quantity: number; name: string; subtotal?: number; unitPrice: number }) => {
          const subtotal = i.subtotal ?? i.unitPrice * i.quantity;
          return `• ${i.quantity} x ${i.name} - $${subtotal.toFixed(2)}`;
        })
        .join("\n");

      const mensaje = `*NEW ORDER - FOODSPV*

Business: ${tenantName}
Customer: ${pedido.customerName || "N/A"}
Phone: ${pedido.customerPhone || "N/A"}

Details:
${items}

Total: $${(pedido.total ?? 0).toFixed(2)}

Status: ${pedido.status || "new"}`;

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[ERROR] WhatsApp:", message);
    }
  }
);
