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
  shipping: Stripe.Checkout.Session.CollectedInformation.ShippingDetails,
  customerEmail: string | null,
): Promise<void> {
  const { variant_id, design_url } = metadata;

  log('createPrintfulOrder inputs', { variant_id, design_url, customerEmail, shipping });

  if (!variant_id) log('WARN: variant_id missing from metadata');
  if (!design_url) log('WARN: design_url missing from metadata');
  if (!shipping.name) log('WARN: shipping.name is empty');
  if (!shipping.address?.line1) log('WARN: shipping.address.line1 is empty');
  if (!shipping.address?.city) log('WARN: shipping.address.city is empty');
  if (!shipping.address?.state) log('WARN: shipping.address.state is empty');
  if (!shipping.address?.postal_code) log('WARN: shipping.address.postal_code is empty');
  if (!shipping.address?.country) log('WARN: shipping.address.country is empty — defaulting to US');

  const body = {
    confirm: true,
    recipient: {
      name: shipping.name ?? '',
      address1: shipping.address?.line1 ?? '',
      ...(shipping.address?.line2 ? { address2: shipping.address.line2 } : {}),
      city: shipping.address?.city ?? '',
      state_code: shipping.address?.state ?? '',
      zip: shipping.address?.postal_code ?? '',
      country_code: shipping.address?.country ?? 'US',
      ...(customerEmail ? { email: customerEmail } : {}),
    },
    items: [{ variant_id: Number(variant_id), quantity: 1, files: [{ type: 'front', url: design_url }] }],
  };

  log('POST /orders →', body);

  const res = await fetch(`${PRINTFUL_BASE}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  log('POST /orders ←', { status: res.status, body: raw });

  if (!res.ok) throw new Error(`Printful order failed: ${raw}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  log('request received', { method: req.method });

  if (req.method !== 'POST') {
    log('rejected: wrong method', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  log('env check', {
    has_stripe_key: !!process.env.STRIPE_SECRET_KEY,
    has_webhook_secret: !!process.env.STRIPE_WEBHOOK_SECRET,
    has_printful_key: !!process.env.PRINTFUL_API_KEY,
    has_sig_header: !!sig,
  });

  let event: Stripe.Event;
  try {
    const rawBody = await getRawBody(req);
    log('raw body length', rawBody.byteLength);
    event = stripe.webhooks.constructEvent(rawBody, sig as string, secret);
  } catch (err) {
    log('signature verification failed', String(err));
    res.status(400).json({ error: 'Webhook signature invalid' });
    return;
  }

  log('event', { type: event.type, id: event.id });

  if (event.type !== 'checkout.session.completed') {
    log('skipping unhandled event type', event.type);
    res.status(200).json({ received: true });
    return;
  }

  const sessionSnapshot = event.data.object as Stripe.Checkout.Session;
  log('fetching full session from Stripe API', sessionSnapshot.id);
  const session = await stripe.checkout.sessions.retrieve(sessionSnapshot.id);

  const shippingDetails = session.collected_information?.shipping_details ?? null;
  const customerEmail = session.customer_details?.email ?? null;

  log('session state', {
    id: session.id,
    payment_status: session.payment_status,
    status: session.status,
    has_metadata: !!session.metadata,
    metadata_keys: session.metadata ? Object.keys(session.metadata) : [],
    has_shipping_details: !!shippingDetails,
    has_customer_details: !!session.customer_details,
    customer_email: customerEmail,
  });

  if (session.payment_status !== 'paid') {
    log('skipping: payment_status is not paid', session.payment_status);
    res.status(200).json({ received: true });
    return;
  }

  if (!session.metadata) {
    log('skipping: session.metadata is missing');
    res.status(200).json({ received: true });
    return;
  }

  if (!shippingDetails) {
    log('skipping: shipping_details is missing from collected_information');
    res.status(200).json({ received: true });
    return;
  }

  log('session metadata', session.metadata);
  log('proceeding to create Printful order for session', session.id);

  try {
    await createPrintfulOrder(
      session.metadata as Record<string, string>,
      shippingDetails,
      customerEmail,
    );
    log('order created successfully for session', session.id);
  } catch (err) {
    log('order creation failed', String(err));
    res.status(500).json({ error: 'Order creation failed' });
    return;
  }

  res.status(200).json({ received: true });
}
