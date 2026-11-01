import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { parsePrintPosition } from '../_lib/printPosition';
import { alertOwner } from '../_lib/alert';
import { shirtVariant } from '../_lib/catalog';
import { sendOrderConfirmation } from '../_lib/orderEmail';
import { captureServerEvent } from '../_lib/analytics';

export const config = { api: { bodyParser: false } };

const PRINTFUL_BASE = 'https://api.printful.com';

function printfulHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
    'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID ?? '',
    'Content-Type': 'application/json',
  };
}

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

interface ExistingOrder {
  id: number;
  status: string;
}

async function findOrderByExternalId(externalId: string): Promise<ExistingOrder | null> {
  const res = await fetch(`${PRINTFUL_BASE}/orders/@${encodeURIComponent(externalId)}`, { headers: printfulHeaders() });
  if (res.status === 404) {
    log('GET /orders/@external_id ← 404 (none yet)', { externalId });
    return null;
  }
  const raw = await res.text();
  log('GET /orders/@external_id ←', { status: res.status, body: raw.slice(0, 500) });
  if (!res.ok) throw new Error(`Printful order lookup failed (${res.status}): ${raw}`);
  const { result } = JSON.parse(raw) as { result: ExistingOrder };
  return { id: result.id, status: result.status };
}

type PrintfulOutcome = 'created+confirmed' | 'created+draft' | 'existing+confirmed' | 'existing+draft' | 'existing+already-confirmed';

interface PlacedOrder {
  orderId: number;
  outcome: PrintfulOutcome;
}

async function confirmOrder(orderId: number): Promise<boolean> {
  if (process.env.PRINTFUL_DRAFT_ONLY === 'true') {
    log('PRINTFUL_DRAFT_ONLY=true — leaving order as an unconfirmed draft (not charged, not printed)', { orderId });
    return false;
  }
  log('confirming order', { orderId });
  const confirmRes = await fetch(`${PRINTFUL_BASE}/orders/${orderId}/confirm`, {
    method: 'POST',
    headers: printfulHeaders(),
  });
  const confirmRaw = await confirmRes.text();
  log('POST /orders/confirm ←', { status: confirmRes.status, body: confirmRaw });
  if (!confirmRes.ok) throw new Error(`Printful order confirmation failed: ${confirmRaw}`);
  log('order confirmed — Printful will charge the billing card and print it', { orderId });
  return true;
}

async function createPrintfulOrder(
  metadata: Record<string, string>,
  shipping: Stripe.Checkout.Session.CollectedInformation.ShippingDetails,
  customerEmail: string | null,
  externalId: string,
): Promise<PlacedOrder> {
  log('looking up existing Printful order', { externalId });
  const existing = await findOrderByExternalId(externalId);
  if (existing) {
    log('order already exists for this payment (Stripe retry or resend)', { externalId, ...existing });
    if (existing.status !== 'draft') return { orderId: existing.id, outcome: 'existing+already-confirmed' };
    const confirmed = await confirmOrder(existing.id);
    return { orderId: existing.id, outcome: confirmed ? 'existing+confirmed' : 'existing+draft' };
  }
  log('no existing order — creating one', { externalId });

  const { variant_id, design_url, print_position } = metadata;
  const position = parsePrintPosition(print_position);

  log('createPrintfulOrder inputs', { variant_id, design_url, customerEmail, shipping });

  if (!variant_id) log('WARN: variant_id missing from metadata');
  if (!design_url) log('WARN: design_url missing from metadata');
  if (!position) log('WARN: print_position missing or invalid — Printful will use its default placement', { print_position });
  if (!shipping.name) log('WARN: shipping.name is empty');
  if (!shipping.address?.line1) log('WARN: shipping.address.line1 is empty');
  if (!shipping.address?.city) log('WARN: shipping.address.city is empty');
  if (!shipping.address?.state) log('WARN: shipping.address.state is empty');
  if (!shipping.address?.postal_code) log('WARN: shipping.address.postal_code is empty');
  if (!shipping.address?.country) log('WARN: shipping.address.country is empty — defaulting to US');

  const body = {
    external_id: externalId,
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
    items: [{ variant_id: Number(variant_id), quantity: 1, files: [{ type: 'front', url: design_url, ...(position ? { position } : {}) }] }],
  };

  log('POST /orders →', body);

  const res = await fetch(`${PRINTFUL_BASE}/orders`, {
    method: 'POST',
    headers: printfulHeaders(),
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  log('POST /orders ←', { status: res.status, body: raw });

  if (!res.ok) throw new Error(`Printful order creation failed: ${raw}`);

  const orderId = (JSON.parse(raw) as { result: { id: number } }).result.id;
  log('order created as draft', { orderId, externalId });
  const confirmed = await confirmOrder(orderId);
  return { orderId, outcome: confirmed ? 'created+confirmed' : 'created+draft' };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const startedAt = Date.now();
  log('request received', { method: req.method, vercelEnv: process.env.VERCEL_ENV ?? 'unset' });

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
    has_store_id: !!process.env.PRINTFUL_STORE_ID,
    store_id: process.env.PRINTFUL_STORE_ID,
    has_resend_key: !!process.env.RESEND_API_KEY,
    has_alert_email: !!process.env.ALERT_EMAIL,
    draft_only: process.env.PRINTFUL_DRAFT_ONLY === 'true',
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

  log('event', { type: event.type, id: event.id, livemode: event.livemode, created: new Date(event.created * 1000).toISOString() });

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
    payment_intent: session.payment_intent,
    amount_total: session.amount_total,
    currency: session.currency,
    payment_status: session.payment_status,
    status: session.status,
    has_metadata: !!session.metadata,
    metadata_keys: session.metadata ? Object.keys(session.metadata) : [],
    collected_information: session.collected_information,
    has_shipping_details: !!shippingDetails,
    shipping_details: shippingDetails,
    has_customer_details: !!session.customer_details,
    customer_email: customerEmail,
  });

  if (session.payment_status !== 'paid') {
    log('skipping: payment_status is not paid', session.payment_status);
    res.status(200).json({ received: true });
    return;
  }

  const alertDetails = {
    stripeSession: session.id,
    paymentIntent: session.payment_intent,
    customerEmail,
    amount: session.amount_total,
    metadata: session.metadata,
  };

  if (!session.metadata || !session.metadata.design_url || !session.metadata.variant_id) {
    log('paid session is missing order metadata');
    await alertOwner('PAID order missing design details — no shirt ordered', alertDetails);
    res.status(200).json({ received: true });
    return;
  }

  if (!shippingDetails) {
    log('paid session has no shipping details');
    await alertOwner('PAID order missing shipping address — no shirt ordered', alertDetails);
    res.status(200).json({ received: true });
    return;
  }

  const externalId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.id.slice(-32);

  log('session metadata', session.metadata);
  log('proceeding to create Printful order for session', session.id);

  const metadata = session.metadata as Record<string, string>;
  const shirt = shirtVariant(Number(metadata.variant_id));
  log('order summary', { name: metadata.name, caption: metadata.caption, variantId: metadata.variant_id, shirt, amountCents: session.amount_total, previewUrl: metadata.preview_url ?? null });

  let placed: PlacedOrder;
  try {
    placed = await createPrintfulOrder(metadata, shippingDetails, customerEmail, externalId);
    log('Printful step done', { session: session.id, externalId, ...placed });
  } catch (err) {
    log('order creation failed', String(err));
    await alertOwner('PAID order could not be placed with Printful (Stripe will retry)', { ...alertDetails, externalId, error: String(err) });
    log('DONE — FAILED, returning 500 so Stripe retries', { session: session.id, externalId, ms: Date.now() - startedAt });
    res.status(500).json({ error: 'Order creation failed' });
    return;
  }

  let emailSent = false;
  if (customerEmail) {
    log('sending order confirmation email', { to: customerEmail, externalId });
    emailSent = await sendOrderConfirmation(customerEmail, {
      name: metadata.name || 'Your name',
      caption: metadata.caption ?? '',
      shirt,
      amountCents: session.amount_total,
      designUrl: metadata.design_url,
      previewUrl: metadata.preview_url || null,
    }, externalId);
    log(emailSent ? 'order confirmation email sent' : 'order confirmation email NOT sent (see [email] lines)', { externalId });
  } else {
    log('no customer email — skipping order confirmation');
  }

  if (!placed.outcome.startsWith('existing')) {
    await captureServerEvent('order_paid', externalId, {
      revenue: (session.amount_total ?? 0) / 100,
      currency: session.currency ?? 'usd',
      color: shirt?.color ?? null,
      size: shirt?.size ?? null,
      has_caption: Boolean(metadata.caption),
      printful: placed.outcome,
      email_sent: emailSent,
    });
  }

  log('DONE', {
    session: session.id,
    externalId,
    printfulOrderId: placed.orderId,
    printful: placed.outcome,
    emailSent,
    ms: Date.now() - startedAt,
  });
  res.status(200).json({ received: true });
}
