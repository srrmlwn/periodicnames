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

export const PRINT_PRODUCTS: PrintProduct[] = [];

export function getPrintProduct(slug: string): PrintProduct | undefined {
  return PRINT_PRODUCTS.find(p => p.slug === slug);
}
