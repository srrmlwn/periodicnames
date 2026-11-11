import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'crypto';
import { alertOwner } from '../_lib/alert';
import { getPrintfulOrder } from '../_lib/printful';
import { notifyShipments } from '../_lib/shipmentNotify';
import { orderStatusUrl } from '../_lib/orderLink';

export const PRINTFUL_EVENTS = ['package_shipped', 'package_returned', 'order_failed', 'order_canceled', 'order_put_hold'] as const;

const OWNER_ALERTS: Record<string, string> = {
  package_returned: 'Package RETURNED to Printful — contact the customer',
  order_failed: 'Printful order FAILED — shirt will not be made until fixed',
  order_canceled: 'Printful order CANCELED — refund the customer in Stripe if not done',
  order_put_hold: 'Printful order ON HOLD — shirt will not be made until resolved',
};

interface PrintfulWebhookBody {
  type?: string;
  store?: number;
  data?: {
    reason?: string;
    order?: { id?: number };
    shipment?: { id?: number };
  };
}

function log(label: string, data?: unknown) {
  console.log(`[printful-webhook] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

function tokenMatches(candidate: unknown): boolean {
  const expected = process.env.PRINTFUL_WEBHOOK_SECRET;
  if (!expected || typeof candidate !== 'string' || candidate.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!tokenMatches(req.query.token)) {
    log('rejected: bad or missing token');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const body = (req.body ?? {}) as PrintfulWebhookBody;
  const type = body.type ?? 'unknown';
  const orderId = body.data?.order?.id;
  log('event', { type, store: body.store, orderId, shipmentId: body.data?.shipment?.id, reason: body.data?.reason });

  if (process.env.PRINTFUL_STORE_ID && body.store !== undefined && String(body.store) !== process.env.PRINTFUL_STORE_ID) {
    log('ignored: different store', body.store);
    res.status(200).json({ received: true });
    return;
  }
  if (!(PRINTFUL_EVENTS as readonly string[]).includes(type) || typeof orderId !== 'number') {
    log('ignored: unhandled event or no order id');
    res.status(200).json({ received: true });
    return;
  }

  const order = await getPrintfulOrder(orderId).catch(err => {
    log('order lookup failed', String(err));
    return undefined;
  });
  if (order === undefined) {
    res.status(500).json({ error: 'Order lookup failed' });
    return;
  }
  if (order === null) {
    log('ignored: order not found in our store', orderId);
    res.status(200).json({ received: true });
    return;
  }

  if (type === 'package_shipped') {
    const results = await notifyShipments(order, body.data?.shipment?.id);
    const failed = Object.values(results).includes('send-failed');
    res.status(failed ? 500 : 200).json({ received: true });
    return;
  }

  await alertOwner(OWNER_ALERTS[type], {
    printfulOrderId: order.id,
    externalId: order.external_id,
    status: order.status,
    reason: body.data?.reason ?? null,
    customerEmail: order.recipient.email ?? null,
    orderPage: order.external_id ? orderStatusUrl(order.external_id) : null,
  });
  res.status(200).json({ received: true });
}
