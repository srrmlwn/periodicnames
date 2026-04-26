import React, { useState, useEffect, useRef } from 'react';
import { ShareImageGenerator } from '../utils/ShareImageGenerator';
import type { NameResult } from '../types';
import type { SharePlatform } from '../types/sharing';

interface SharePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: NameResult;
}

const PLATFORMS: { id: SharePlatform; label: string }[] = [
  { id: 'x', label: 'X Post' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'story', label: 'Story' },
];

const ASPECT: Record<SharePlatform, string> = {
  x: '16 / 9',
  instagram: '1 / 1',
  story: '9 / 16',
};

const SharePreviewModal: React.FC<SharePreviewModalProps> = ({ isOpen, onClose, result }) => {
  const [platform, setPlatform] = useState<SharePlatform>('x');
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatorRef = useRef(new ShareImageGenerator());
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setImageBlob(null);
    setImageUrl(null);
    setIsGenerating(true);

    const generate = async () => {
      const gen = generatorRef.current;
      let blob: Blob;
      if (platform === 'x') blob = await gen.generateXImage(result);
      else if (platform === 'instagram') blob = await gen.generateInstagramImage(result);
      else blob = await gen.generateStoryImage(result);

      if (cancelled) return;
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setImageBlob(blob);
      setImageUrl(url);
      setIsGenerating(false);
    };

    generate().catch(err => {
      if (!cancelled) {
        console.error('Share image generation failed:', err);
        setIsGenerating(false);
      }
    });

    return () => { cancelled = true; };
  }, [isOpen, platform, result]);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const handleShare = async () => {
    if (!imageBlob) return;
    const filename = `periodic-names-${result.originalName.toLowerCase().replace(/\s+/g, '-')}-${platform}.png`;
    const file = new File([imageBlob], filename, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${result.originalName} in Periodic Table Elements`,
          text: `My name spelled with periodic table elements! Try yours at periodicnames.com`,
        });
        return;
      } catch {
        // fall through to download
      }
    }

    const url = URL.createObjectURL(imageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.canShare;

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

        <h2 className="text-base font-bold text-gray-800 mb-4">Share your name</h2>

        <div className="flex gap-2 mb-4">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                platform === p.id
                  ? 'bg-slate-800 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div
          className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-4 flex items-center justify-center mx-auto"
          style={{ aspectRatio: ASPECT[platform], maxHeight: '280px', width: '100%' }}
        >
          {isGenerating ? (
            <div className="flex flex-col items-center gap-2 text-gray-400 py-8">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Generating…</span>
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt="Share preview" className="w-full h-full object-contain" />
          ) : null}
        </div>

        <button
          onClick={handleShare}
          disabled={!imageBlob || isGenerating}
          className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 ${
            imageBlob && !isGenerating
              ? 'bg-slate-800 text-white hover:bg-slate-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {canNativeShare ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SharePreviewModal;
