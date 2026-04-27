import React from 'react';
import type { PrintProduct } from '../data/printProducts';

interface ProductMockupProps {
  mockupUrl: string;
  product: PrintProduct;
  variantId: number;
  onBack: () => void;
  onOrder: () => Promise<void>;
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
      </div>

      <button
        onClick={() => { void onOrder(); }}
        disabled={isOrdering}
        className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 ${
          isOrdering
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-slate-800 text-white hover:bg-slate-700'
        }`}
      >
        {isOrdering ? (
          <>
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Processing…</span>
          </>
        ) : (
          'Order'
        )}
      </button>
    </>
  );
};

export default ProductMockup;
