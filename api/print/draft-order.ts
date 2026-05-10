import type { VercelRequest, VercelResponse } from '@vercel/node';

// Test-only endpoint: creates a Printful draft order (confirm: false) without going through Stripe.
// Gated by PRINTFUL_TEST_SECRET to prevent accidental public use.
// Usage: POST /api/print/draft-order
// Body: { secret, variantId, designUrl, recipientName?, recipientEmail? }

const PRINTFUL_BASE = 'https://api.printful.com';

function log(label: string, data?: unknown) {
  console.log(`[draft-order] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const testSecret = process.env.PRINTFUL_TEST_SECRET;
  if (!testSecret) {
    res.status(503).json({ error: 'Test endpoint not configured' });
    return;
  }

  const { secret, variantId, designUrl, recipientName, recipientEmail } = req.body as {
    secret?: string;
    variantId?: number;
    designUrl?: string;
    recipientName?: string;
    recipientEmail?: string;
  };

  if (secret !== testSecret) {
    res.status(401).json({ error: 'Invalid test secret' });
    return;
  }

  if (!variantId || !designUrl) {
    res.status(400).json({ error: 'variantId and designUrl are required' });
    return;
  }

  const body = {
    confirm: false,
    recipient: {
      name: recipientName ?? 'Test User',
      address1: '123 Test St',
      city: 'San Francisco',
      state_code: 'CA',
      zip: '94103',
      country_code: 'US',
      ...(recipientEmail ? { email: recipientEmail } : {}),
    },
    items: [{ variant_id: Number(variantId), quantity: 1, files: [{ type: 'front', url: designUrl }] }],
  };

  log('POST /orders (draft) →', { variantId, designUrl, recipientName });

  const pfRes = await fetch(`${PRINTFUL_BASE}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const raw = await pfRes.text();
  log('POST /orders ←', { status: pfRes.status, body: raw });

  if (!pfRes.ok) {
    res.status(502).json({ error: 'Printful order failed', detail: raw });
    return;
  }

  const data = JSON.parse(raw) as { result: { id: number; status: string } };
  res.status(200).json({ orderId: data.result.id, status: data.result.status });
}
