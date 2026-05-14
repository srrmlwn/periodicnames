import type { VercelRequest, VercelResponse } from '@vercel/node';

// Test-only endpoint: creates a Printful draft order (confirm: false) without going through Stripe.
// Gated by PRINTFUL_TEST_SECRET to prevent accidental public use.
// Usage: POST /api/print/draft-order
// Body: { secret, variantId, designUrl, recipientName?, recipientEmail? }

const PRINTFUL_BASE = 'https://api.printful.com';

function printfulHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
    'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID ?? '',
    'Content-Type': 'application/json',
  };
}

function log(label: string, data?: unknown) {
  console.log(`[draft-order] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  log('request received', { method: req.method });

  if (req.method !== 'POST') {
    log('rejected: wrong method', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  log('env check', {
    has_printful_key: !!process.env.PRINTFUL_API_KEY,
    has_store_id: !!process.env.PRINTFUL_STORE_ID,
    store_id: process.env.PRINTFUL_STORE_ID,
    has_test_secret: !!process.env.PRINTFUL_TEST_SECRET,
  });

  const testSecret = process.env.PRINTFUL_TEST_SECRET;
  if (!testSecret) {
    log('rejected: PRINTFUL_TEST_SECRET not configured');
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
    log('rejected: invalid test secret');
    res.status(401).json({ error: 'Invalid test secret' });
    return;
  }

  if (!variantId || !designUrl) {
    log('rejected: missing required fields', { hasVariantId: !!variantId, hasDesignUrl: !!designUrl });
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

  log('POST /orders (draft) →', { variantId, designUrl, recipientName, recipientEmail });

  let pfRes: Response;
  let raw: string;
  try {
    pfRes = await fetch(`${PRINTFUL_BASE}/orders`, {
      method: 'POST',
      headers: printfulHeaders(),
      body: JSON.stringify(body),
    });
    raw = await pfRes.text();
  } catch (err) {
    log('POST /orders network error', String(err));
    res.status(502).json({ error: 'Printful request failed', detail: String(err) });
    return;
  }

  log('POST /orders ←', { status: pfRes.status, body: raw });

  if (!pfRes.ok) {
    res.status(502).json({ error: 'Printful order failed', detail: raw });
    return;
  }

  let data: { result: { id: number; status: string } };
  try {
    data = JSON.parse(raw) as { result: { id: number; status: string } };
  } catch {
    log('response parse error', raw);
    res.status(502).json({ error: 'Printful response unparseable', detail: raw });
    return;
  }

  log('draft order created', { orderId: data.result.id, status: data.result.status });
  res.status(200).json({ orderId: data.result.id, status: data.result.status });
}
