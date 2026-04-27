import type { VercelRequest, VercelResponse } from '@vercel/node';

const PRINTFUL_BASE = 'https://api.printful.com';

interface PrintfulOrderResult {
  id: number;
  dashboard_url?: string;
}

interface PrintfulResponse<T> {
  result: T;
}

function log(label: string, data?: unknown) {
  console.log(`[order] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

// TODO: Printful does not expose a public hosted checkout URL — integrate Printful checkout flow
// when available, or redirect to dashboard for now.
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { variantId, designUrl } = req.body as {
    variantId?: unknown;
    designUrl?: unknown;
  };

  log('request', { variantId, designUrl });

  const authHeader = `Bearer ${process.env.PRINTFUL_API_KEY}`;
  const orderBody = {
    confirm: false,
    items: [{ variant_id: variantId, quantity: 1, files: [{ url: designUrl }] }],
  };

  log('POST /orders →', orderBody);

  const orderRes = await fetch(`${PRINTFUL_BASE}/orders`, {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify(orderBody),
  });

  const orderRaw = await orderRes.text();
  log('POST /orders ←', { status: orderRes.status, body: orderRaw });

  if (!orderRes.ok) {
    res.status(502).json({ error: 'Order creation failed', detail: orderRaw });
    return;
  }

  const orderData = JSON.parse(orderRaw) as PrintfulResponse<PrintfulOrderResult>;
  const { id, dashboard_url } = orderData.result;

  log('order created', { id, dashboard_url });

  res.status(200).json({
    orderId: id,
    checkoutUrl: dashboard_url ?? 'https://www.printful.com/dashboard',
  });
}
