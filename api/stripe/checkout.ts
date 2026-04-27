import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

interface Recipient {
  name: string;
  address1: string;
  city: string;
  state_code: string;
  zip: string;
  country_code: string;
}

function log(label: string, data?: unknown) {
  console.log(`[checkout] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { productName, variantId, productId, designUrl, priceUsd, recipient } = req.body as {
    productName?: string;
    variantId?: number;
    productId?: number;
    designUrl?: string;
    priceUsd?: number;
    recipient?: Recipient;
  };

  if (!variantId || !productId || !designUrl || !priceUsd || !recipient || !productName) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  log('request', { productName, variantId, productId, priceUsd, recipient });

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
        },
      },
    }],
    shipping_address_collection: undefined,
    metadata: {
      variant_id: String(variantId),
      product_id: String(productId),
      design_url: designUrl,
      recipient_name: recipient.name,
      recipient_address1: recipient.address1,
      recipient_city: recipient.city,
      recipient_state_code: recipient.state_code,
      recipient_zip: recipient.zip,
      recipient_country_code: recipient.country_code,
    },
    success_url: `${origin}/?order=success`,
    cancel_url: `${origin}/`,
  });

  log('session created', { id: session.id, url: session.url });

  res.status(200).json({ checkoutUrl: session.url });
}
