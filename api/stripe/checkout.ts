import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { parsePrintPosition, serializePrintPosition } from '../_lib/printPosition';
import { TSHIRT_PRODUCT_ID, TSHIRT_VARIANT_IDS, chargePriceUsd } from '../_lib/catalog';
import { isOwnDesignUrl } from '../_lib/designUrl';
import { isOffensiveCaption, isOffensiveName } from '../_lib/textFilter';

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

  const { productName, variantId, productId, designUrl, mockupUrl, position: rawPosition, name, caption } = req.body as {
    productName?: string;
    variantId?: number;
    productId?: number;
    designUrl?: unknown;
    mockupUrl?: unknown;
    position?: unknown;
    name?: unknown;
    caption?: unknown;
  };

  const nameText = typeof name === 'string' ? name.slice(0, 60) : '';
  const captionText = typeof caption === 'string' ? caption.slice(0, 60) : '';
  if (!nameText || isOffensiveName(nameText) || isOffensiveCaption(captionText)) {
    log('rejected: name/caption failed content check', { nameText, captionText });
    res.status(422).json({ error: "We can't print that text" });
    return;
  }

  const position = parsePrintPosition(rawPosition);

  const invalid = [
    typeof productName !== 'string' && 'productName',
    productId !== TSHIRT_PRODUCT_ID && 'productId',
    !(typeof variantId === 'number' && TSHIRT_VARIANT_IDS.has(variantId)) && 'variantId',
    !isOwnDesignUrl(designUrl) && 'designUrl',
    !position && 'position',
  ].filter(Boolean);

  if (invalid.length > 0 || !isOwnDesignUrl(designUrl) || !position) {
    log('rejected: invalid fields', invalid);
    res.status(400).json({ error: 'Invalid order', invalid });
    return;
  }

  const effectivePrice = chargePriceUsd();
  const productImage = typeof mockupUrl === 'string' && mockupUrl.startsWith('https://') ? mockupUrl : undefined;

  log('request', { productName, variantId, productId, effectivePrice, vercelEnv: process.env.VERCEL_ENV ?? 'unset' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const origin = process.env.VERCEL_ENV === 'production' || !process.env.VERCEL_URL
    ? 'https://periodicnames.com'
    : `https://${process.env.VERCEL_URL}`;

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
            ...(productImage ? { images: [productImage] } : {}),
          },
        },
      }],
      shipping_address_collection: { allowed_countries: ['US'] },
      metadata: {
        variant_id: String(variantId),
        product_id: String(productId),
        design_url: designUrl,
        name: nameText,
        caption: captionText,
        print_position: serializePrintPosition(position),
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
