import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

function log(label: string, data?: unknown) {
  console.log(`[checkout] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  log('request received', { method: req.method });

  if (req.method !== 'POST') {
    log('rejected: wrong method', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  log('env check', {
    has_stripe_key: !!process.env.STRIPE_SECRET_KEY,
    has_price_override: !!process.env.VITE_PRICE_OVERRIDE_USD,
  });

  const { productName, variantId, productId, designUrl, mockupUrl, priceUsd } = req.body as {
    productName?: string;
    variantId?: number;
    productId?: number;
    designUrl?: string;
    mockupUrl?: string;
    priceUsd?: number;
  };

  const missing = [
    !productName && 'productName',
    !variantId && 'variantId',
    !productId && 'productId',
    !designUrl && 'designUrl',
    !priceUsd && 'priceUsd',
  ].filter(Boolean);

  if (missing.length > 0) {
    log('rejected: missing required fields', missing);
    res.status(400).json({ error: 'Missing required fields', missing });
    return;
  }

  const priceOverrideEnv = process.env.VITE_PRICE_OVERRIDE_USD;
  const effectivePrice = priceOverrideEnv ? parseFloat(priceOverrideEnv) : priceUsd!;

  log('request', { productName, variantId, productId, priceUsd, effectivePrice, priceOverrideEnv: priceOverrideEnv ?? 'not set' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const origin = 'https://periodicnames.com';

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(effectivePrice * 100),
          product_data: {
            name: `Periodic Names ${productName}`,
            description: 'Custom element-name print design',
            ...(mockupUrl ? { images: [mockupUrl] } : {}),
          },
        },
      }],
      shipping_address_collection: { allowed_countries: ['US'] },
      metadata: {
        variant_id: String(variantId),
        product_id: String(productId),
        design_url: designUrl!,
      },
      success_url: `${origin}/?order=success`,
      cancel_url: `${origin}/`,
    });
  } catch (err) {
    log('stripe session creation failed', String(err));
    res.status(500).json({ error: 'Failed to create checkout session' });
    return;
  }

  log('session created', { id: session.id, url: session.url });
  res.status(200).json({ checkoutUrl: session.url });
}
