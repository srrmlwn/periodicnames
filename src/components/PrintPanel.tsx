import React, { useRef, useState } from 'react';
import type { NameResult } from '../types';
import { PRINT_PRODUCTS, SHIRT_COLORS, findShirtVariant } from '../data/printProducts';
import type { ShirtColor, ShirtSize } from '../data/printProducts';
import { generatePrintFile } from '../utils/PrintDesignGenerator';
import type { CaptionPosition, Placement, PrintPosition } from '../utils/printLayout';
import Modal from './Modal';
import ShirtPreview from './ShirtPreview';
import ShirtOptions from './ShirtOptions';

interface PrintPanelProps {
  isOpen: boolean;
  onClose: () => void;
  result: NameResult;
}

interface UploadedDesign {
  url: string;
  position: PrintPosition;
}

type ModelPhoto =
  | { key: string; status: 'loading' }
  | { key: string; status: 'ready'; url: string }
  | { key: string; status: 'error' };

type BuyStatus = 'idle' | 'preparing' | 'redirecting';

const PRODUCT = PRINT_PRODUCTS[0];

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} failed (${res.status})`);
  return res.json() as Promise<T>;
}

const PrintPanel: React.FC<PrintPanelProps> = ({ isOpen, onClose, result }) => {
  const [color, setColor] = useState<ShirtColor>(SHIRT_COLORS[0]);
  const [size, setSize] = useState<ShirtSize | null>(null);
  const [placement, setPlacement] = useState<Placement>('chest');
  const [caption, setCaption] = useState('');
  const [captionPosition, setCaptionPosition] = useState<CaptionPosition>('above');
  const [captionOpen, setCaptionOpen] = useState(false);
  const [modelPhoto, setModelPhoto] = useState<ModelPhoto | null>(null);
  const [buyStatus, setBuyStatus] = useState<BuyStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const uploads = useRef(new Map<string, UploadedDesign>());

  if (!isOpen) return null;

  const designKey = `${result.orderedElements.map(e => e.name).join(',')}|${placement}|${caption.trim()}|${captionPosition}|${color.dark ? 'dark' : 'light'}`;
  const photoKey = `${designKey}|${color.name}`;
  const photo = modelPhoto?.key === photoKey ? modelPhoto : null;

  const uploadDesign = async (): Promise<UploadedDesign> => {
    const cached = uploads.current.get(designKey);
    if (cached) return cached;
    const file = await generatePrintFile(result, caption, placement, color.dark, captionPosition);
    const { url } = await postJson<{ url: string }>('/api/print/upload', { dataUrl: await blobToDataUrl(file.blob) });
    const uploaded = { url, position: file.position };
    uploads.current.set(designKey, uploaded);
    return uploaded;
  };

  const showOnModel = async () => {
    const key = photoKey;
    setModelPhoto({ key, status: 'loading' });
    try {
      const design = await uploadDesign();
      const variant = findShirtVariant(color, size ?? 'M');
      const { mockups } = await postJson<{ mockups: { mockupUrl: string }[] }>('/api/print/mockup', {
        productId: PRODUCT.id,
        variantIds: [variant?.id],
        designUrl: design.url,
        placement: PRODUCT.designPlacement,
        position: design.position,
      });
      const url = mockups[0]?.mockupUrl;
      setModelPhoto(url ? { key, status: 'ready', url } : { key, status: 'error' });
    } catch {
      setModelPhoto({ key, status: 'error' });
    }
  };

  const buy = async () => {
    const variant = size ? findShirtVariant(color, size) : undefined;
    if (!variant) return;
    setError(null);
    setBuyStatus('preparing');
    try {
      const design = await uploadDesign();
      setBuyStatus('redirecting');
      const { checkoutUrl } = await postJson<{ checkoutUrl: string }>('/api/stripe/checkout', {
        productName: PRODUCT.name,
        productId: PRODUCT.id,
        variantId: variant.id,
        designUrl: design.url,
        position: design.position,
        mockupUrl: photo?.status === 'ready' ? photo.url : undefined,
        priceUsd: PRODUCT.priceUsd,
      });
      window.location.href = checkoutUrl;
    } catch {
      setBuyStatus('idle');
      setError("Couldn't start checkout. Please try again in a moment.");
    }
  };

  const buyLabel =
    buyStatus === 'preparing' ? 'Preparing your print…' :
    buyStatus === 'redirecting' ? 'Opening checkout…' :
    size ? `Buy · $${PRODUCT.priceUsd.toFixed(2)}` : 'Pick a size';

  return (
    <Modal isOpen={isOpen} onClose={onClose} label="Put your name on a tee" widthClass="max-w-3xl" className="max-h-[92vh] overflow-y-auto">
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        <div className="relative bg-mist border-b-[3px] md:border-b-0 md:border-r-[3px] border-ink rounded-t-[9px] md:rounded-tr-none md:rounded-l-[9px] px-4 pt-5 pb-3 sm:pt-6 sm:pb-4 flex flex-col items-center justify-center gap-2 sm:gap-3">
          {photo?.status === 'ready' ? (
            <img src={photo.url} alt={`${result.originalName} on a ${color.name} t-shirt`} className="w-full max-w-[260px] sm:max-w-[340px] rounded-lg border-[3px] border-ink bg-white" />
          ) : (
            <div className="relative w-full">
              <ShirtPreview result={result} color={color} placement={placement} caption={caption} captionPosition={captionPosition} />
              {photo?.status === 'loading' && (
                <p className="absolute inset-x-0 bottom-2 mx-auto w-fit rounded-md border-2 border-ink bg-white px-2.5 py-1 text-xs font-bold shadow-brutal-sm">
                  Getting a photo from Printful…
                </p>
              )}
            </div>
          )}
          {photo?.status === 'ready' ? (
            <button type="button" onClick={() => setModelPhoto(null)} className="nb-focus text-sm font-bold underline decoration-2 underline-offset-2">
              ← Back to the drawing
            </button>
          ) : (
            <button
              type="button"
              onClick={showOnModel}
              disabled={photo?.status === 'loading'}
              className="nb-focus text-sm font-bold underline decoration-2 underline-offset-2 disabled:opacity-50 disabled:no-underline"
            >
              See it on a model →
            </button>
          )}
          {photo?.status === 'error' && (
            <p className="text-xs font-semibold text-muted text-center">Couldn't load the photo. The drawing is to scale.</p>
          )}
        </div>

        <div className="px-5 pt-5 pb-5 sm:pt-6 flex flex-col gap-4 sm:gap-5">
          <div className="pr-10">
            <h2 className="text-xl font-bold text-ink">Your periodic tee</h2>
            <p className="text-sm text-muted mt-0.5">{PRODUCT.description}</p>
          </div>
          <ShirtOptions
            color={color}
            size={size}
            placement={placement}
            caption={caption}
            captionPosition={captionPosition}
            captionOpen={captionOpen}
            onColor={setColor}
            onSize={setSize}
            onPlacement={setPlacement}
            onCaption={setCaption}
            onCaptionPosition={setCaptionPosition}
            onOpenCaption={() => setCaptionOpen(true)}
          />
          <div className="mt-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={buy}
              disabled={!size || buyStatus !== 'idle'}
              className="nb-btn bg-pop-yellow w-full py-3 text-lg"
            >
              {buyLabel}
            </button>
            {error && <p role="alert" className="text-sm font-semibold text-pop-coral text-center">{error}</p>}
            <p className="text-xs text-muted text-center">Printed &amp; shipped by Printful · US shipping</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PrintPanel;
