export const PRINTFUL_BASE = 'https://api.printful.com';

export function printfulHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
    'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID ?? '',
    'Content-Type': 'application/json',
  };
}

export interface PrintfulShipment {
  id: number;
  carrier: string;
  service: string;
  tracking_number: string;
  tracking_url: string;
  ship_date?: string;
  shipped_at?: number;
  reshipment?: boolean;
}

export interface PrintfulOrder {
  id: number;
  external_id: string | null;
  status: string;
  created: number;
  updated: number;
  recipient: { email?: string | null };
  items: { variant_id: number; quantity: number }[];
  shipments: PrintfulShipment[];
}

export async function getPrintfulOrder(idOrExternal: number | string): Promise<PrintfulOrder | null> {
  const path = typeof idOrExternal === 'number' ? String(idOrExternal) : `@${encodeURIComponent(idOrExternal)}`;
  const res = await fetch(`${PRINTFUL_BASE}/orders/${path}`, { headers: printfulHeaders() });
  if (res.status === 404) return null;
  const raw = await res.text();
  if (!res.ok) throw new Error(`Printful order lookup failed (${res.status}): ${raw.slice(0, 300)}`);
  return (JSON.parse(raw) as { result: PrintfulOrder }).result;
}

export async function listPrintfulOrders(status: string, limit: number): Promise<PrintfulOrder[]> {
  const res = await fetch(`${PRINTFUL_BASE}/orders?status=${encodeURIComponent(status)}&limit=${limit}`, { headers: printfulHeaders() });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Printful order list failed (${res.status}): ${raw.slice(0, 300)}`);
  return (JSON.parse(raw) as { result: PrintfulOrder[] }).result;
}

export function shipmentShippedAt(shipment: PrintfulShipment): number | null {
  if (shipment.shipped_at) return shipment.shipped_at * 1000;
  if (shipment.ship_date) {
    const parsed = Date.parse(shipment.ship_date);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export type OrderStage = 'received' | 'printing' | 'shipped' | 'problem' | 'canceled';

export function orderStage(order: Pick<PrintfulOrder, 'status' | 'shipments'>): OrderStage {
  if (order.status === 'canceled') return 'canceled';
  if (order.shipments.some(s => s.tracking_number)) return 'shipped';
  if (order.status === 'failed' || order.status === 'onhold') return 'problem';
  if (order.status === 'inprocess' || order.status === 'partial') return 'printing';
  return 'received';
}
