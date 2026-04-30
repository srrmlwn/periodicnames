import React, { useState, useEffect } from 'react';
import type { NameResult } from '../types';
import { PRINT_PRODUCTS } from '../data/printProducts';
import { PrintDesignGenerator } from '../utils/PrintDesignGenerator';
import ProductMockup from './ProductMockup';
import DesignCanvas from './DesignCanvas';

interface PrintPanelProps {
  isOpen: boolean;
  onClose: () => void;
  result: NameResult;
}

interface Offset { x: number; y: number }

type Step = 'design' | 'variants' | 'loading' | 'mockup' | 'redirecting' | 'error';

const PROGRESS_LABELS = ['Design', 'Customize', 'Preview'] as const;

const PRODUCT = PRINT_PRODUCTS[0];

const CAPTION_PLACEHOLDERS = [
  'e.g. Born to be periodic',
  'e.g. Elementally yours',
  'e.g. Made of stardust',
  'e.g. Periodic and proud',
  'e.g. The element of surprise',
  'e.g. My name is science',
];

const PrintPanel: React.FC<PrintPanelProps> = ({ isOpen, onClose, result }) => {
  const [step, setStep] = useState<Step>('design');
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [tilesOffset, setTilesOffset] = useState<Offset>({ x: 0, y: 0 });
  const [captionOffset, setCaptionOffset] = useState<Offset>({ x: 0, y: 0 });
  const [showWatermark, setShowWatermark] = useState(true);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    if (!isOpen || customText || step !== 'design') return;
    const id = setInterval(
      () => setPlaceholderIdx(i => (i + 1) % CAPTION_PLACEHOLDERS.length),
      2500,
    );
    return () => clearInterval(id);
  }, [isOpen, customText, step]);

  if (!isOpen) return null;

  const uniqueColors = [...new Set(
    PRODUCT.variants.map(v => v.color).filter((c): c is string => c !== undefined)
  )];

  const sizesForColor = selectedColor
    ? PRODUCT.variants.filter(v => v.color === selectedColor)
    : [];

  const canPreview = selectedVariantId !== null;

  const startPreview = (variantId: number) => {
    setStep('loading');
    const flow = async () => {
      setLoadingStatus('Creating your design…');
      const generator = new PrintDesignGenerator();
      const blob = await generator.generatePrintDesign(
        result,
        customText.trim() || undefined,
        tilesOffset,
        captionOffset,
        showWatermark,
      );

      setLoadingStatus('Sending to printer…');
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

      setLoadingStatus('Generating preview…');
      const mockupRes = await fetch('/api/print/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: PRODUCT.id,
          variantIds: [variantId],
          designUrl: uploadedDesignUrl,
          placement: PRODUCT.designPlacement,
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

  const handlePreview = () => {
    if (selectedVariantId === null) return;
    startPreview(selectedVariantId);
  };

  const handleCheckout = async () => {
    if (selectedVariantId === null || !designUrl) return;
    setStep('redirecting');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: PRODUCT.name,
          productId: PRODUCT.id,
          variantId: selectedVariantId,
          designUrl,
          priceUsd: PRODUCT.priceUsd,
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

  const progressStep =
    step === 'design' ? 0 :
    step === 'variants' ? 1 : 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative flex flex-col h-[600px] max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors duration-150"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Progress bar */}
        {step !== 'error' && (
          <div className="flex items-center px-6 pt-5 pb-1 pr-12 shrink-0">
            {PROGRESS_LABELS.map((label, i) => {
              const done = i < progressStep;
              const active = i === progressStep;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors duration-200 ${
                      done ? 'bg-slate-800 text-white' : active ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`text-[9px] font-semibold tracking-wide ${active || done ? 'text-slate-700' : 'text-gray-300'}`}>
                      {label}
                    </span>
                  </div>
                  {i < PROGRESS_LABELS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-3.5 rounded-full transition-colors duration-300 ${i < progressStep ? 'bg-slate-800' : 'bg-gray-100'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        <div className="px-6 pb-6 pt-3 flex-1 overflow-y-auto">

          {/* ── Step 1: Design ── */}
          {step === 'design' && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-gray-800">Design your t-shirt</h2>

              {/* Caption */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Caption
                </p>
                <input
                  type="text"
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  placeholder={CAPTION_PLACEHOLDERS[placeholderIdx]}
                  maxLength={60}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-slate-400 text-gray-700 placeholder-gray-300"
                />
              </div>

              {/* Background */}
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1 shrink-0">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Background table
                </p>
                <div className="flex-1" />
                <button
                  type="button"
                  role="switch"
                  aria-checked={showWatermark}
                  onClick={() => setShowWatermark(v => !v)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${showWatermark ? 'bg-slate-700' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ${showWatermark ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Position */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                  </svg>
                  Position
                </p>
                <DesignCanvas
                  result={result}
                  customText={customText}
                  showWatermark={showWatermark}
                  initialTilesOff={tilesOffset}
                  initialCaptionOff={captionOffset}
                  onTilesOffsetChange={setTilesOffset}
                  onCaptionOffsetChange={setCaptionOffset}
                />
              </div>

              <button
                onClick={() => setStep('variants')}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors duration-150"
              >
                Next — pick size & color →
              </button>
            </div>
          )}

          {/* ── Step 2: Customize ── */}
          {step === 'variants' && (
            <>
              <div className="flex items-center gap-2 mb-5">
                <button
                  onClick={() => setStep('design')}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150 text-sm flex items-center gap-0.5"
                >
                  <span className="text-xl leading-none">‹</span>
                  <span>Design</span>
                </button>
                <h2 className="text-base font-bold text-gray-800 ml-1">Size & color</h2>
                <span className="ml-auto text-sm font-semibold text-gray-500">${PRODUCT.priceUsd.toFixed(2)}</span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">Color</p>
                  <div className="flex gap-2 flex-wrap">
                    {uniqueColors.map(color => (
                      <button
                        key={color}
                        onClick={() => { setSelectedColor(color); setSelectedVariantId(null); }}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-150 ${
                          selectedColor === color ? 'border-slate-800 scale-110' : 'border-gray-300'
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

              <button
                onClick={handlePreview}
                disabled={!canPreview}
                className={`mt-5 w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors duration-150 ${
                  canPreview
                    ? 'bg-slate-800 text-white hover:bg-slate-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Preview mockup
              </button>
            </>
          )}

          {/* Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm text-gray-500">{loadingStatus}</p>
                {loadingStatus.includes('preview') && (
                  <p className="text-xs text-gray-400 mt-1">This usually takes about 10 seconds</p>
                )}
              </div>
            </div>
          )}

          {/* Mockup */}
          {step === 'mockup' && selectedVariantId !== null && mockupUrl && (
            <ProductMockup
              mockupUrl={mockupUrl}
              product={PRODUCT}
              variantId={selectedVariantId}
              onBack={() => setStep('variants')}
              onEditDesign={() => setStep('design')}
              onOrder={handleCheckout}
              isOrdering={false}
            />
          )}

          {/* Redirecting */}
          {step === 'redirecting' && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Redirecting to checkout…</p>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm text-gray-600 text-center">{errorMessage}</p>
              <div className="flex flex-col items-center gap-2">
                {selectedVariantId !== null && (
                  <button
                    onClick={() => startPreview(selectedVariantId)}
                    className="px-5 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors duration-150"
                  >
                    Try again
                  </button>
                )}
                <button
                  onClick={() => setStep('design')}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-150"
                >
                  Start over
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PrintPanel;
