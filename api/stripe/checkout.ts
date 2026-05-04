import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

function log(label: string, data?: unknown) {
  console.log(`[checkout] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
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

  if (!variantId || !productId || !designUrl || !priceUsd || !productName) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  log('request', { productName, variantId, productId, priceUsd });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const origin = req.headers.origin ?? 'https://periodicnames.com';

  const session = await stripe.checkout.sessions.create({
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
  });

  log('session created', { id: session.id, url: session.url });
  res.status(200).json({ checkoutUrl: session.url });
}
