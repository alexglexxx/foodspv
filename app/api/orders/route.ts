import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps || admin.apps.length === 0) {
  try {
    admin.initializeApp();
  } catch (e) {
    // ignore if already initialized or if credentials are provided differently in hosting
    console.warn('Firebase admin initialization warning:', e);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId, customerName, customerPhone, items, paymentMethod, source } = body as any;

    if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) return NextResponse.json({ error: 'Invalid customerName' }, { status: 400 });
    if (!customerPhone || typeof customerPhone !== 'string' || customerPhone.trim().length < 10) return NextResponse.json({ error: 'Invalid customerPhone' }, { status: 400 });
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'Items required' }, { status: 400 });
    if (items.length > 30) return NextResponse.json({ error: 'Too many items' }, { status: 400 });

    const db = admin.firestore();

    // Fetch and validate menu items from server-side source of truth
    const validatedItems: any[] = [];
    for (const it of items) {
      if (!it || !it.id) return NextResponse.json({ error: 'Invalid item payload' }, { status: 400 });
      const docRef = db.collection('tenants').doc(tenantId).collection('menu').doc(it.id);
      const docSnap = await docRef.get();
      if (!docSnap.exists) return NextResponse.json({ error: `Menu item not found: ${it.id}` }, { status: 400 });
      const data = docSnap.data() as any;
      const unitPrice = typeof data.precio === 'number' ? data.precio : (data.unitPrice ?? 0);
      const name = data.nombre || data.name || 'Item';
      const quantity = Number(it.quantity ?? it.cantidad ?? 1);
      if (quantity <= 0) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
      const subtotal = Number((unitPrice * quantity).toFixed(2));
      validatedItems.push({ id: it.id, name, unitPrice, quantity, subtotal });
    }

    const serverTotal = validatedItems.reduce((acc, it) => acc + it.subtotal, 0);

    // Optional: if client sent total, compare
    if (typeof (body.total) === 'number') {
      const clientTotal = Number(body.total.toFixed ? body.total : body.total);
      if (Math.abs(clientTotal - serverTotal) > 0.01) {
        return NextResponse.json({ error: 'Total mismatch', clientTotal, serverTotal }, { status: 400 });
      }
    }

    // Build order object (server authoritative)
    const orderObj = {
      tenantId,
      customerName: String(customerName).trim(),
      customerPhone: String(customerPhone).trim(),
      items: validatedItems,
      total: Number(serverTotal.toFixed(2)),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'new',
      paymentMethod: paymentMethod || 'pickup',
      source: source || 'public_menu',
    } as any;

    // Persist order
    const orderRef = await db.collection('tenants').doc(tenantId).collection('orders').add(orderObj);

    return NextResponse.json({ ok: true, id: orderRef.id }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Order validation endpoint error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
