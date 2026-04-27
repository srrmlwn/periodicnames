import React, { useState } from 'react';
import type { NameResult } from '../types';
import { PRINT_PRODUCTS } from '../data/printProducts';
import type { PrintProduct } from '../data/printProducts';
import { PrintDesignGenerator } from '../utils/PrintDesignGenerator';
import ProductMockup from './ProductMockup';

interface PrintPanelProps {
  isOpen: boolean;
  onClose: () => void;
  result: NameResult;
}

interface Recipient {
  name: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
}

type Step = 'products' | 'variants' | 'loading' | 'mockup' | 'address' | 'redirecting' | 'error';

const PRODUCT_ICONS: Record<string, string> = {
  tshirt: '👕',
  mug: '☕',
  poster: '🖼',
};

const EMPTY_RECIPIENT: Recipient = { name: '', address1: '', city: '', state: '', zip: '' };

const PrintPanel: React.FC<PrintPanelProps> = ({ isOpen, onClose, result }) => {
  const [step, setStep] = useState<Step>('products');
  const [selectedProduct, setSelectedProduct] = useState<PrintProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<Recipient>(EMPTY_RECIPIENT);

  if (!isOpen) return null;

  const handleSelectProduct = (product: PrintProduct) => {
    setSelectedProduct(product);
    setSelectedVariantId(null);
    setSelectedColor(null);
    if (product.slug !== 'tshirt' && product.variants.length > 0) {
      setSelectedVariantId(product.variants[0].id);
    }
    setStep('variants');
  };

  const uniqueColors = selectedProduct
    ? [...new Set(
        selectedProduct.variants
          .map(v => v.color)
          .filter((c): c is string => c !== undefined)
      )]
    : [];

  const sizesForColor = selectedColor && selectedProduct
    ? selectedProduct.variants.filter(v => v.color === selectedColor)
    : [];

  const canPreview =
    selectedProduct !== null &&
    (selectedProduct.slug !== 'tshirt' || selectedVariantId !== null);

  const handlePreview = () => {
    if (!selectedProduct) return;
    setStep('loading');

    const flow = async () => {
      setLoadingStatus('Generating design…');
      const generator = new PrintDesignGenerator();
      const blob = await generator.generatePrintDesign(result);

      setLoadingStatus('Uploading…');
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const uploadRes = await fetch('/api/print/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url: uploadedDesignUrl } = await uploadRes.json() as { url: string };
      setDesignUrl(uploadedDesignUrl);

      setLoadingStatus('Generating mockup…');
      const mockupRes = await fetch('/api/print/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          variantIds: [selectedVariantId ?? selectedProduct.variants[0].id],
          designUrl: uploadedDesignUrl,
          placement: selectedProduct.designPlacement,
        }),
      });
      if (!mockupRes.ok) throw new Error('Mockup generation failed');
      const { mockups } = await mockupRes.json() as { mockups: { variantId: number; mockupUrl: string }[] };

      setMockupUrl(mockups[0]?.mockupUrl ?? null);
      setStep('mockup');
    };

    flow().catch(err => {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
      setStep('error');
    });
  };

  const recipientValid =
    recipient.name.trim() !== '' &&
    recipient.address1.trim() !== '' &&
    recipient.city.trim() !== '' &&
    recipient.state.trim() !== '' &&
    recipient.zip.trim() !== '';

  const handleCheckout = async () => {
    if (!selectedProduct || !selectedVariantId || !designUrl || !recipientValid) return;
    setStep('redirecting');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct.name,
          productId: selectedProduct.id,
          variantId: selectedVariantId,
          designUrl,
          priceUsd: selectedProduct.priceUsd,
          recipient: {
            name: recipient.name,
            address1: recipient.address1,
            city: recipient.city,
            state_code: recipient.state,
            zip: recipient.zip,
            country_code: 'US',
          },
        }),
      });
      if (!res.ok) throw new Error('Checkout session creation failed');
      const { checkoutUrl } = await res.json() as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Checkout failed');
      setStep('error');
    }
  };

  const field = (
    label: string,
    key: keyof Recipient,
    placeholder: string,
    opts?: { className?: string },
  ) => (
    <div className={opts?.className}>
      <label className="block text-xs text-gray-500 font-medium mb-1">{label}</label>
      <input
        type="text"
        value={recipient[key]}
        onChange={e => setRecipient(r => ({ ...r, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-slate-400"
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-150"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'products' && (
          <>
            <h2 className="text-base font-bold text-gray-800 mb-4">Print on merch</h2>
            <div className="grid grid-cols-3 gap-3">
              {PRINT_PRODUCTS.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className="rounded-xl border-2 border-gray-100 hover:border-slate-300 p-4 cursor-pointer text-center transition-colors"
                >
                  <div className="text-2xl mb-2">{PRODUCT_ICONS[product.slug] ?? '📦'}</div>
                  <p className="text-xs font-semibold text-gray-800">{product.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">${product.priceUsd.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'variants' && selectedProduct && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setStep('products')}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-150 text-base leading-none"
              >
                ‹
              </button>
              <h2 className="text-base font-bold text-gray-800">{selectedProduct.name}</h2>
              <span className="ml-auto text-sm font-semibold text-gray-500">${selectedProduct.priceUsd.toFixed(2)}</span>
            </div>

            {selectedProduct.slug === 'tshirt' ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">Color</p>
                  <div className="flex gap-2 flex-wrap">
                    {uniqueColors.map(color => (
                      <button
                        key={color}
                        onClick={() => { setSelectedColor(color); setSelectedVariantId(null); }}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-150 ${
                          selectedColor === color ? 'border-slate-800 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>

                {selectedColor && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2">Size</p>
                    <div className="flex gap-2 flex-wrap">
                      {sizesForColor.map(variant => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariantId(variant.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-colors duration-150 ${
                            selectedVariantId === variant.id
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-slate-300'
                          }`}
                        >
                          {variant.size ?? variant.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-gray-500">
                Ready to preview
              </div>
            )}

            <button
              onClick={handlePreview}
              disabled={!canPreview}
              className={`mt-5 w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors duration-150 ${
                canPreview
                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Preview
            </button>
          </>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">{loadingStatus}</p>
          </div>
        )}

        {step === 'mockup' && selectedProduct && selectedVariantId !== null && mockupUrl && (
          <ProductMockup
            mockupUrl={mockupUrl}
            product={selectedProduct}
            variantId={selectedVariantId}
            onBack={() => setStep('variants')}
            onOrder={() => setStep('address')}
            isOrdering={false}
          />
        )}

        {step === 'address' && selectedProduct && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setStep('mockup')}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-150 text-base leading-none"
              >
                ‹
              </button>
              <h2 className="text-base font-bold text-gray-800">Shipping address</h2>
            </div>

            <div className="space-y-3">
              {field('Full name', 'name', 'Jane Smith')}
              {field('Address', 'address1', '123 Main St')}
              <div className="grid grid-cols-2 gap-3">
                {field('City', 'city', 'New York')}
                {field('State', 'state', 'NY')}
              </div>
              {field('ZIP code', 'zip', '10001')}
              <p className="text-xs text-gray-400">US addresses only.</p>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {selectedProduct.name} · ${selectedProduct.priceUsd.toFixed(2)}
              </span>
              <button
                onClick={handleCheckout}
                disabled={!recipientValid}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-150 ${
                  recipientValid
                    ? 'bg-slate-800 text-white hover:bg-slate-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Pay ${selectedProduct.priceUsd.toFixed(2)}
              </button>
            </div>
          </>
        )}

        {step === 'redirecting' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Redirecting to checkout…</p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm text-gray-600 text-center">{errorMessage}</p>
            <button
              onClick={() => setStep('variants')}
              className="px-5 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors duration-150"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintPanel;
