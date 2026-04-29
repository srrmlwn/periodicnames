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

  const body = {
    confirm: true,
    recipient: {
      name: shipping.name ?? '',
      address1: shipping.address?.line1 ?? '',
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
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig as string, secret);
  } catch (err) {
    log('signature verification failed', String(err));
    res.status(400).json({ error: 'Webhook signature invalid' });
    return;
  }

  log('event', { type: event.type, id: event.id });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === 'paid' && session.metadata && session.shipping_details) {
      const customerEmail = session.customer_details?.email ?? null;
      try {
        await createPrintfulOrder(
          session.metadata as Record<string, string>,
          session.shipping_details,
          customerEmail,
        );
        log('order created for session', session.id);
      } catch (err) {
        log('order creation failed', String(err));
        res.status(500).json({ error: 'Order creation failed' });
        return;
      }
    }
  }

  res.status(200).json({ received: true });
}
