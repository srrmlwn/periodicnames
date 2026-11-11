import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isValidOrderLinkKey } from '../_lib/orderLink';
import { getPrintfulOrder, orderStage, shipmentShippedAt } from '../_lib/printful';
import { shirtVariant } from '../_lib/catalog';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const { id, key } = req.query;
  if (req.method !== 'GET' || typeof id !== 'string' || typeof key !== 'string' || !isValidOrderLinkKey(id, key)) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  let order;
  try {
    order = await getPrintfulOrder(id);
  } catch (err) {
    console.error('[order-status] lookup failed', String(err));
    res.status(502).json({ error: 'Could not reach the printer right now' });
    return;
  }
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const variantId = order.items[0]?.variant_id;
  const shirt = variantId ? shirtVariant(variantId) : null;
  res.status(200).json({
    stage: orderStage(order),
    placedAt: new Date(order.created * 1000).toISOString(),
    shirt: shirt ? { color: shirt.color, size: shirt.size } : null,
    shipments: order.shipments
      .filter(s => s.tracking_number)
      .map(s => {
        const shippedAt = shipmentShippedAt(s);
        return {
          carrier: s.carrier,
          trackingNumber: s.tracking_number,
          trackingUrl: s.tracking_url,
          shippedAt: shippedAt ? new Date(shippedAt).toISOString() : null,
        };
      }),
  });
}
