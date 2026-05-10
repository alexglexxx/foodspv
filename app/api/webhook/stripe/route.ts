import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key_for_build", {
  apiVersion: "2026-04-22.dahlia" as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    if (!sig || !endpointSecret) {
      // For development without webhook secret verification
      event = JSON.parse(payload);
    } else {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const { tenantId, customerName, customerPhone, items } = session.metadata || {};

    if (tenantId) {
      try {
        await addDoc(collection(db, "tenants", tenantId, "orders"), {
          nombreCliente: customerName,
          telefonoCliente: customerPhone,
          items: JSON.parse(items || "[]"),
          total: session.amount_total ? session.amount_total / 100 : 0,
          createdAt: serverTimestamp(),
          estado: "nuevo",
          paymentStatus: "paid",
          stripeSessionId: session.id,
        });
        console.log(`✅ Order saved for tenant ${tenantId}`);
      } catch (e) {
        console.error("❌ Error saving order to Firestore:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
