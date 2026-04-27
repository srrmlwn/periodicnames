import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const PRINTFUL_BASE = 'https://api.printful.com';

function log(label: string, data?: unknown) {
  console.log(`[webhook] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

async function createPrintfulOrder(metadata: Record<string, string>): Promise<void> {
  const {
    variant_id, design_url,
    recipient_name, recipient_address1, recipient_city,
    recipient_state_code, recipient_zip, recipient_country_code,
  } = metadata;

  const body = {
    confirm: true,
    recipient: {
      name: recipient_name,
      address1: recipient_address1,
      city: recipient_city,
      state_code: recipient_state_code,
      zip: recipient_zip,
      country_code: recipient_country_code,
    },
    items: [{ variant_id: Number(variant_id), quantity: 1, files: [{ url: design_url }] }],
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
    // Vercel parses the body by default; reconstruct raw bytes for signature verification.
    // The body shape is stable since Stripe sends JSON.
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    event = stripe.webhooks.constructEvent(rawBody, sig as string, secret);
  } catch (err) {
    log('signature verification failed', String(err));
    res.status(400).json({ error: 'Webhook signature invalid' });
    return;
  }

  log('event', { type: event.type, id: event.id });

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === 'paid' && session.metadata) {
      try {
        await createPrintfulOrder(session.metadata as Record<string, string>);
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
