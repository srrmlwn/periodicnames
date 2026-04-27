import type { VercelRequest, VercelResponse } from '@vercel/node';

// This endpoint is now only called by the Stripe webhook after payment.
// Direct client calls to /api/print/order are no longer used.
export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
  res.status(410).json({ error: 'Use /api/stripe/checkout to initiate an order' });
}
