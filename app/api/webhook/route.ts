import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/firebase";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// ========================================
// VERIFY TOKEN
// ========================================

const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN ||
  "foodspv_verify_token";

// ========================================
// GET → META VERIFICATION
// ========================================

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WEBHOOK VERIFIED");

    return new NextResponse(challenge, {
      status: 200,
    });
  }

  return NextResponse.json(
    {
      error: "Invalid verify token",
    },
    {
      status: 403,
    }
  );
}

// ========================================
// POST → INCOMING EVENTS
// ========================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log(
      "📩 Incoming webhook:",
      JSON.stringify(body, null, 2)
    );

    const entry = body.entry?.[0];

    const changes = entry?.changes?.[0];

    const value = changes?.value;

    const messages = value?.messages;

    const metadata = value?.metadata;

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        received: true,
      });
    }

    const msg = messages[0];

    const phoneNumberId =
      metadata?.phone_number_id || null;

    const from = msg.from || null;

    const text =
      msg.text?.body || "[non-text-message]";

    // ========================================
    // SAVE MESSAGE
    // ========================================

    await addDoc(collection(db, "messages"), {
      tenantPhoneNumberId: phoneNumberId,
      from,
      text,
      raw: body,
      createdAt: serverTimestamp(),
    });

    console.log("✅ Message saved");

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error);

    return NextResponse.json(
      {
        error: "Webhook failed",
      },
      {
        status: 500,
      }
    );
  }
}
