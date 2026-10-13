import React, { useEffect } from 'react';

interface ShareLightboxProps {
  url: string;
  isVideo: boolean;
  label: string;
  onClose: () => void;
}

const ShareLightbox: React.FC<ShareLightboxProps> = ({ url, isVideo, label, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const mediaClass = 'block max-h-[90dvh] max-w-[92vw] w-auto h-auto rounded-xl border-[3px] border-ink shadow-brutal-xl bg-white';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={e => { e.stopPropagation(); onClose(); }}
    >
      <div onClick={e => e.stopPropagation()}>
        {isVideo ? (
          <video src={url} className={mediaClass} autoPlay loop playsInline controls aria-label={label} />
        ) : (
          <img src={url} alt={label} className={mediaClass} />
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="nb-focus absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-md border-[3px] border-ink bg-white shadow-brutal-sm hover:bg-pop-pink"
        aria-label="Close full-size preview"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ShareLightbox;
