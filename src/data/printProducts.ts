export interface PrintVariant {
  id: number;
  label: string;
  color?: string;
  size?: string;
}

export interface PrintProduct {
  id: number;
  name: string;
  slug: 'tshirt' | 'mug' | 'poster';
  description: string;
  variants: PrintVariant[];
  designPlacement: string;
}

// NOTE: replace with real Printful variant IDs from GET /v2/catalog/products/71/variants
const TSHIRT_VARIANTS: PrintVariant[] = [
  { id: 4012, label: 'White / S', color: '#FFFFFF', size: 'S' },
  { id: 4013, label: 'White / M', color: '#FFFFFF', size: 'M' },
  { id: 4014, label: 'White / L', color: '#FFFFFF', size: 'L' },
  { id: 4015, label: 'White / XL', color: '#FFFFFF', size: 'XL' },
  { id: 4017, label: 'Black / S', color: '#1a1a1a', size: 'S' },
  { id: 4018, label: 'Black / M', color: '#1a1a1a', size: 'M' },
  { id: 4019, label: 'Black / L', color: '#1a1a1a', size: 'L' },
  { id: 4020, label: 'Black / XL', color: '#1a1a1a', size: 'XL' },
  { id: 4021, label: 'Navy / S', color: '#1a2a4a', size: 'S' },
  { id: 4022, label: 'Navy / M', color: '#1a2a4a', size: 'M' },
  { id: 4023, label: 'Navy / L', color: '#1a2a4a', size: 'L' },
  { id: 4024, label: 'Navy / XL', color: '#1a2a4a', size: 'XL' },
];

export const PRINT_PRODUCTS: PrintProduct[] = [
  {
    id: 71,
    name: 'Unisex T-Shirt',
    slug: 'tshirt',
    description: 'Bella+Canvas 3001 unisex jersey tee, soft and pre-shrunk.',
    variants: TSHIRT_VARIANTS,
    designPlacement: 'front',
  },
  {
    id: 19,
    name: '11oz Mug',
    slug: 'mug',
    description: '11oz ceramic mug, dishwasher safe.',
    variants: [
      { id: 1791, label: 'White', color: '#FFFFFF' },
    ],
    designPlacement: 'print_area',
  },
  {
    id: 1,
    name: 'Poster',
    slug: 'poster',
    description: '18×24in matte poster, museum-quality print.',
    variants: [
      { id: 2459, label: 'Matte / 18×24in' },
    ],
    designPlacement: 'front',
  },
];

export function getPrintProduct(slug: string): PrintProduct | undefined {
  return PRINT_PRODUCTS.find((p) => p.slug === slug);
}
