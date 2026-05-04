import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

const PRINTFUL_BASE = 'https://api.printful.com';

function log(label: string, data?: unknown) {
  console.log(`[webhook] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function createPrintfulOrder(
  metadata: Record<string, string>,
  shipping: Stripe.Checkout.Session.ShippingDetails,
  customerEmail: string | null,
): Promise<void> {
  const { variant_id, design_url } = metadata;

  log('printful order inputs', { variant_id, design_url, customerEmail, shipping });

  if (!variant_id) throw new Error('Missing variant_id in session metadata');
  if (!design_url) throw new Error('Missing design_url in session metadata');

  const body = {
    confirm: true,
    recipient: {
      name: shipping.name ?? '',
      address1: shipping.address?.line1 ?? '',
      address2: shipping.address?.line2 ?? '',
      city: shipping.address?.city ?? '',
      state_code: shipping.address?.state ?? '',
      zip: shipping.address?.postal_code ?? '',
      country_code: shipping.address?.country ?? 'US',
      ...(customerEmail ? { email: customerEmail } : {}),
    },
    items: [{
      variant_id: Number(variant_id),
      quantity: 1,
      files: [{ type: 'front', url: design_url }],
    }],
  };

  log('POST /orders → request body', body);

  const apiKey = process.env.PRINTFUL_API_KEY;
  if (!apiKey) {
    log('ERROR: PRINTFUL_API_KEY env var is not set');
    throw new Error('PRINTFUL_API_KEY is not configured');
  }
  log('PRINTFUL_API_KEY present', { keyPrefix: apiKey.slice(0, 8) + '...' });

  const res = await fetch(`${PRINTFUL_BASE}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  log('POST /orders ← response', { status: res.status, body: raw });

  if (!res.ok) {
    throw new Error(`Printful order failed (HTTP ${res.status}): ${raw}`);
  }

  const parsed = JSON.parse(raw) as { result?: { id?: number; status?: string } };
  log('Printful order created', { orderId: parsed.result?.id, status: parsed.result?.status });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  log('incoming request', { method: req.method, url: req.url });

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  log('env check', {
    has_stripe_key: !!process.env.STRIPE_SECRET_KEY,
    has_webhook_secret: !!secret,
    has_signature: !!sig,
  });

  if (!secret) {
    log('ERROR: STRIPE_WEBHOOK_SECRET is not set');
    res.status(500).json({ error: 'Webhook secret not configured' });
    return;
  }

  let event: Stripe.Event;
  try {
    const rawBody = await getRawBody(req);
    log('raw body size (bytes)', rawBody.byteLength);
    event = stripe.webhooks.constructEvent(rawBody, sig as string, secret);
  } catch (err) {
    log('signature verification failed', String(err));
    res.status(400).json({ error: 'Webhook signature invalid' });
    return;
  }

  log('event received', { type: event.type, id: event.id });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    log('session details', {
      id: session.id,
      payment_status: session.payment_status,
      status: session.status,
      customer_email: session.customer_details?.email,
      has_metadata: !!session.metadata,
      metadata: session.metadata,
      has_shipping_details: !!session.shipping_details,
      shipping_details: session.shipping_details,
      amount_total: session.amount_total,
    });

    if (session.payment_status !== 'paid') {
      log('skipping — payment_status is not paid', session.payment_status);
      res.status(200).json({ received: true });
      return;
    }

    if (!session.metadata || !Object.keys(session.metadata).length) {
      log('ERROR: session metadata is empty or missing');
      res.status(200).json({ received: true });
      return;
    }

    if (!session.shipping_details) {
      log('ERROR: shipping_details is missing — shipping address collection may not be enabled on the checkout session');
      res.status(200).json({ received: true });
      return;
    }

    const customerEmail = session.customer_details?.email ?? null;
    log('proceeding to create Printful order', { customerEmail });

    try {
      await createPrintfulOrder(
        session.metadata as Record<string, string>,
        session.shipping_details,
        customerEmail,
      );
      log('SUCCESS: Printful order created for session', session.id);
    } catch (err) {
      log('ERROR: Printful order creation failed', String(err));
      res.status(500).json({ error: 'Order creation failed' });
      return;
    }
  } else {
    log('unhandled event type — ignoring', event.type);
  }

  res.status(200).json({ received: true });
}
