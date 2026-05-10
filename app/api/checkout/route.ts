import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key_for_build", {
  apiVersion: "2026-04-22.dahlia" as any, // Use latest or stable
});

export async function POST(req: NextRequest) {
  try {
    const { items, tenantId, customerName, customerPhone } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "mxn",
          product_data: {
            name: item.nombre,
          },
          unit_amount: Math.round(item.precio * 100), // Stripe uses cents
        },
        quantity: item.cantidad,
      })),
      mode: "payment",
      success_url: `${req.nextUrl.origin}/${tenantId}?success=true`,
      cancel_url: `${req.nextUrl.origin}/${tenantId}?canceled=true`,
      metadata: {
        tenantId,
        customerName,
        customerPhone,
        items: JSON.stringify(items.map((i: any) => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad }))),
      },
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error("STRIPE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
