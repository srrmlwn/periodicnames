export const TSHIRT_PRODUCT_ID = 71;

export interface ShirtVariant {
  color: string;
  colorHex: string;
  size: string;
}

const SHIRT_COLORS: Record<string, string> = {
  White: '#FFFFFF',
  Black: '#1a1a1a',
  Navy: '#1a2a4a',
  'Athletic Heather': '#cececc',
};

const VARIANT_COLORS: [string, number[]][] = [
  ['White', [4011, 4012, 4013, 4014]],
  ['Black', [4016, 4017, 4018, 4019]],
  ['Navy', [4111, 4112, 4113, 4114]],
  ['Athletic Heather', [6948, 6949, 6950, 6951]],
];

const SIZES = ['S', 'M', 'L', 'XL'];

const TSHIRT_VARIANTS: ReadonlyMap<number, ShirtVariant> = new Map(
  VARIANT_COLORS.flatMap(([color, ids]) =>
    ids.map((id, i): [number, ShirtVariant] => [id, { color, colorHex: SHIRT_COLORS[color], size: SIZES[i] }])),
);

export const TSHIRT_VARIANT_IDS: ReadonlySet<number> = new Set(TSHIRT_VARIANTS.keys());

export function shirtVariant(variantId: number): ShirtVariant | null {
  return TSHIRT_VARIANTS.get(variantId) ?? null;
}

const LIST_PRICE_USD = 29.99;

export function chargePriceUsd(): number {
  const override = process.env.VITE_PRICE_OVERRIDE_USD;
  if (override && process.env.VERCEL_ENV !== 'production') {
    const parsed = parseFloat(override);
    if (Number.isFinite(parsed) && parsed >= 0.5) return parsed;
  }
  return LIST_PRICE_USD;
}
