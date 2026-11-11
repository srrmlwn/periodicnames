import Stripe from 'stripe';
import { BlobNotFoundError, head, put } from '@vercel/blob';
import { shirtVariant } from './catalog';
import { orderStatusUrl } from './orderLink';
import type { PrintfulOrder, PrintfulShipment } from './printful';
import { sendShippedEmail } from './shippedEmail';
import { alertOwner } from './alert';

function log(label: string, data?: unknown) {
  console.log(`[shipment] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

function markerPath(shipmentId: number): string {
  return `order-emails/shipped-${shipmentId}.json`;
}

async function alreadyEmailed(shipmentId: number): Promise<boolean> {
  try {
    await head(markerPath(shipmentId));
    return true;
  } catch (err) {
    if (err instanceof BlobNotFoundError) return false;
    throw err;
  }
}

async function markEmailed(shipmentId: number): Promise<void> {
  await put(markerPath(shipmentId), JSON.stringify({ sentAt: new Date().toISOString() }), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

interface OrderMetadata {
  name: string | null;
  previewUrl: string | null;
}

async function stripeOrderMetadata(paymentIntent: string): Promise<OrderMetadata> {
  if (!paymentIntent.startsWith('pi_') || !process.env.STRIPE_SECRET_KEY) return { name: null, previewUrl: null };
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntent, limit: 1 });
    const metadata = sessions.data[0]?.metadata ?? {};
    return { name: metadata.name || null, previewUrl: metadata.preview_url || null };
  } catch (err) {
    log('Stripe metadata lookup failed — sending without name/picture', String(err));
    return { name: null, previewUrl: null };
  }
}

export type ShipmentResult = 'sent' | 'already-sent' | 'no-email' | 'no-tracking' | 'send-failed';

async function notifyShipment(order: PrintfulOrder, shipment: PrintfulShipment, metadata: () => Promise<OrderMetadata>): Promise<ShipmentResult> {
  const to = order.recipient.email;
  if (!shipment.tracking_number || !shipment.tracking_url) return 'no-tracking';
  if (!to) {
    await alertOwner('Order shipped but has no customer email — customer not notified', { printfulOrderId: order.id, externalId: order.external_id, shipmentId: shipment.id });
    return 'no-email';
  }
  if (await alreadyEmailed(shipment.id)) return 'already-sent';

  const { name, previewUrl } = await metadata();
  const variantId = order.items[0]?.variant_id;
  const sent = await sendShippedEmail(to, {
    name,
    shirt: variantId ? shirtVariant(variantId) : null,
    previewUrl,
    carrier: shipment.carrier,
    trackingNumber: shipment.tracking_number,
    trackingUrl: shipment.tracking_url,
    statusUrl: order.external_id ? orderStatusUrl(order.external_id) : null,
    reshipment: Boolean(shipment.reshipment),
  }, shipment.id);

  if (!sent) {
    await alertOwner('Shipping email could not be sent — customer not notified', { printfulOrderId: order.id, externalId: order.external_id, shipmentId: shipment.id, trackingUrl: shipment.tracking_url });
    return 'send-failed';
  }
  await markEmailed(shipment.id);
  return 'sent';
}

export async function notifyShipments(order: PrintfulOrder, onlyShipmentId?: number): Promise<Record<number, ShipmentResult>> {
  let cached: Promise<OrderMetadata> | null = null;
  const metadata = () => (cached ??= stripeOrderMetadata(order.external_id ?? ''));
  const results: Record<number, ShipmentResult> = {};
  for (const shipment of order.shipments) {
    if (onlyShipmentId !== undefined && shipment.id !== onlyShipmentId) continue;
    results[shipment.id] = await notifyShipment(order, shipment, metadata);
  }
  log('done', { printfulOrderId: order.id, externalId: order.external_id, results });
  return results;
}
