export const TSHIRT_PRODUCT_ID = 71;

export const TSHIRT_VARIANT_IDS: ReadonlySet<number> = new Set([
  4011, 4012, 4013, 4014,
  4016, 4017, 4018, 4019,
  4111, 4112, 4113, 4114,
  6948, 6949, 6950, 6951,
]);

const LIST_PRICE_USD = 29.99;

export function chargePriceUsd(): number {
  const override = process.env.VITE_PRICE_OVERRIDE_USD;
  if (override && process.env.VERCEL_ENV !== 'production') {
    const parsed = parseFloat(override);
    if (Number.isFinite(parsed) && parsed >= 0.5) return parsed;
  }
  return LIST_PRICE_USD;
}
