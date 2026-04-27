import type { VercelRequest, VercelResponse } from '@vercel/node';

const PRINTFUL_BASE = 'https://api.printful.com';

interface PrintfulOrderResult {
  id: number;
  dashboard_url?: string;
}

interface PrintfulResponse<T> {
  result: T;
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

  const authHeader = `Bearer ${process.env.PRINTFUL_API_KEY}`;

  const orderRes = await fetch(`${PRINTFUL_BASE}/orders`, {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      confirm: false,
      items: [
        {
          variant_id: variantId,
          quantity: 1,
          files: [{ url: designUrl }],
        },
      ],
    }),
  });

  const orderData = (await orderRes.json()) as PrintfulResponse<PrintfulOrderResult>;
  const { id, dashboard_url } = orderData.result;

  res.status(200).json({
    orderId: id,
    checkoutUrl: dashboard_url ?? 'https://www.printful.com/dashboard',
  });
}
