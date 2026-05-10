export interface PrintVariant {
  id: number;
  label: string;
  color?: string;
  size?: string;
}

export interface PrintProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  priceUsd: number;
  variants: PrintVariant[];
  designPlacement: string;
}

const TSHIRT_VARIANTS: PrintVariant[] = [
  { id: 4011, label: 'White / S',  color: '#FFFFFF', size: 'S' },
  { id: 4012, label: 'White / M',  color: '#FFFFFF', size: 'M' },
  { id: 4013, label: 'White / L',  color: '#FFFFFF', size: 'L' },
  { id: 4014, label: 'White / XL', color: '#FFFFFF', size: 'XL' },
  { id: 4016, label: 'Black / S',  color: '#1a1a1a', size: 'S' },
  { id: 4017, label: 'Black / M',  color: '#1a1a1a', size: 'M' },
  { id: 4018, label: 'Black / L',  color: '#1a1a1a', size: 'L' },
  { id: 4019, label: 'Black / XL', color: '#1a1a1a', size: 'XL' },
  { id: 4111, label: 'Navy / S',             color: '#1a2a4a', size: 'S' },
  { id: 4112, label: 'Navy / M',             color: '#1a2a4a', size: 'M' },
  { id: 4113, label: 'Navy / L',             color: '#1a2a4a', size: 'L' },
  { id: 4114, label: 'Navy / XL',            color: '#1a2a4a', size: 'XL' },
  { id: 6948, label: 'Athletic Heather / S', color: '#cececc', size: 'S' },
  { id: 6949, label: 'Athletic Heather / M', color: '#cececc', size: 'M' },
  { id: 6950, label: 'Athletic Heather / L', color: '#cececc', size: 'L' },
  { id: 6951, label: 'Athletic Heather / XL',color: '#cececc', size: 'XL' },
];

export const PRINT_PRODUCTS: PrintProduct[] = [
  {
    id: 71,
    name: 'Unisex T-Shirt',
    slug: 'tshirt',
    description: 'Bella+Canvas 3001 unisex jersey tee, soft and pre-shrunk.',
    priceUsd: import.meta.env.VITE_PRICE_OVERRIDE_USD
      ? parseFloat(import.meta.env.VITE_PRICE_OVERRIDE_USD as string)
      : 29.99,
    variants: TSHIRT_VARIANTS,
    designPlacement: 'front',
  },
];

export function getPrintProduct(slug: string): PrintProduct | undefined {
  return PRINT_PRODUCTS.find((p) => p.slug === slug);
}
