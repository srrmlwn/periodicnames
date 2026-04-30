import React from 'react';
import type { PrintProduct } from '../data/printProducts';

interface ProductMockupProps {
  mockupUrl: string;
  product: PrintProduct;
  variantId: number;
  onBack: () => void;
  onOrder: () => void;
  isOrdering: boolean;
}

const ProductMockup: React.FC<ProductMockupProps> = ({
  mockupUrl,
  product,
  variantId,
  onBack,
  onOrder,
  isOrdering,
}) => {
  const variant = product.variants.find(v => v.id === variantId);

  return (
    <>
      <button
        onClick={onBack}
        className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-150 mb-3 flex items-center gap-1"
      >
        <span className="text-base leading-none">‹</span>
        <span>Back</span>
      </button>

      <img
        src={mockupUrl}
        alt="Product preview"
        className="w-full rounded-xl object-contain mb-4"
        style={{ maxHeight: '280px' }}
      />

      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-800">{product.name}</p>
        {variant && (
          <p className="text-xs text-gray-500 mt-0.5">{variant.label}</p>
        )}
        <p className="text-sm font-semibold text-gray-800 mt-1">${product.priceUsd.toFixed(2)}</p>
      </div>

      <button
        onClick={onOrder}
        disabled={isOrdering}
        className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors duration-150 bg-slate-800 text-white hover:bg-slate-700"
      >
        Buy — ${product.priceUsd.toFixed(2)}
      </button>
      <p className="text-center text-[10px] text-gray-400 mt-2">
        Printed & shipped by Printful · Ships in 3–5 days
      </p>
    </>
  );
};

export default ProductMockup;
