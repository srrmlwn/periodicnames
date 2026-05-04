import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

function log(label: string, data?: unknown) {
  console.log(`[checkout] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  log('incoming request', { method: req.method });

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { productName, variantId, productId, designUrl, mockupUrl, priceUsd } = req.body as {
    productName?: string;
    variantId?: number;
    productId?: number;
    designUrl?: string;
    mockupUrl?: string;
    priceUsd?: number;
  };

  log('request body', { productName, variantId, productId, priceUsd, designUrl, mockupUrl });

  if (!variantId || !productId || !designUrl || !priceUsd || !productName) {
    log('ERROR: missing required fields', { variantId: !!variantId, productId: !!productId, designUrl: !!designUrl, priceUsd: !!priceUsd, productName: !!productName });
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  log('env check', { has_stripe_key: !!process.env.STRIPE_SECRET_KEY });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const origin = req.headers.origin ?? 'https://periodicnames.com';
  log('origin', origin);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(priceUsd * 100),
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
      design_url: designUrl,
    },
    success_url: `${origin}/?order=success`,
    cancel_url: `${origin}/`,
  };

  log('creating Stripe session', {
    mode: sessionParams.mode,
    unit_amount: Math.round(priceUsd * 100),
    metadata: sessionParams.metadata,
    shipping_countries: sessionParams.shipping_address_collection?.allowed_countries,
    has_mockup_image: !!mockupUrl,
  });

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    log('session created', { id: session.id, url: session.url });
    res.status(200).json({ checkoutUrl: session.url });
  } catch (err) {
    log('ERROR: Stripe session creation failed', String(err));
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
