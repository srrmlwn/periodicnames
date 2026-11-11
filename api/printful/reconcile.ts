import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'crypto';
import { getPrintfulOrder, listPrintfulOrders, shipmentShippedAt } from '../_lib/printful';
import { notifyShipments } from '../_lib/shipmentNotify';
import { alertOwner } from '../_lib/alert';

const LOOKBACK_MS = 10 * 24 * 60 * 60 * 1000;
const STUCK_MS = 7 * 24 * 60 * 60 * 1000;

function log(label: string, data?: unknown) {
  console.log(`[reconcile] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

function authorized(header: string | undefined): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const expected = `Bearer ${secret}`;
  return header.length === expected.length && timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!authorized(req.headers.authorization)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const now = Date.now();
  const summary: Record<string, unknown> = {};

  try {
    for (const status of ['fulfilled', 'partial']) {
      const orders = await listPrintfulOrders(status, 50);
      for (const listed of orders) {
        if (now - listed.updated * 1000 > LOOKBACK_MS) continue;
        const order = await getPrintfulOrder(listed.id);
        if (!order) continue;
        const recent = order.shipments.filter(s => {
          const shippedAt = shipmentShippedAt(s);
          return shippedAt === null || now - shippedAt <= LOOKBACK_MS;
        });
        if (recent.length === 0) continue;
        const results: Record<number, string> = {};
        for (const shipment of recent) Object.assign(results, await notifyShipments(order, shipment.id));
        summary[order.id] = results;
      }
    }

    for (const status of ['pending', 'inprocess', 'onhold', 'failed']) {
      const orders = await listPrintfulOrders(status, 50);
      const stuck = orders.filter(o => now - o.created * 1000 > STUCK_MS);
      if (stuck.length > 0) {
        await alertOwner(`${stuck.length} Printful order(s) still "${status}" after 7 days`, {
          orders: stuck.map(o => ({ printfulOrderId: o.id, externalId: o.external_id, created: new Date(o.created * 1000).toISOString() })),
        });
      }
    }
  } catch (err) {
    log('failed', String(err));
    await alertOwner('Daily order check failed', { error: String(err) });
    res.status(500).json({ error: 'Reconcile failed' });
    return;
  }

  log('done', summary);
  res.status(200).json({ ok: true, checked: summary });
}
