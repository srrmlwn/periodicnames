import React, { useState, useEffect } from 'react';
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
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomed(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed]);

  return (
    <>
      <button
        onClick={onBack}
        className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-150 mb-3 flex items-center gap-1"
      >
        <span className="text-base leading-none">‹</span>
        <span>Back</span>
      </button>

      <div
        className="relative cursor-zoom-in mb-4 group"
        onClick={() => setZoomed(true)}
      >
        <img
          src={mockupUrl}
          alt="Product preview"
          className="w-full rounded-xl object-contain"
          style={{ maxHeight: '280px' }}
        />
        <div className="absolute bottom-2 right-2 bg-black/40 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zm0 0" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 8v6m-3-3h6" />
          </svg>
        </div>
      </div>

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

      {zoomed && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <img
            src={mockupUrl}
            alt="Product preview enlarged"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors duration-150"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default ProductMockup;
