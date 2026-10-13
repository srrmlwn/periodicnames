import React, { useCallback, useState } from 'react';
import ShareLightbox from './ShareLightbox';
import type { ShareFormat } from '../utils/shareScene';
import type { ShareMedia } from '../types/sharing';

interface ShareMediaPreviewProps {
  format: ShareFormat;
  media: ShareMedia | null;
  progress: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  name: string;
}

const MEDIA_CLASS = 'block max-h-full max-w-full w-auto h-auto rounded-lg border-[3px] border-ink shadow-brutal bg-white';

const ShareMediaPreview: React.FC<ShareMediaPreviewProps> = ({ format, media, progress, canvasRef, name }) => {
  const ready = media?.status === 'ready' ? media : null;
  const recording = format === 'reel' && media?.status === 'working';
  const [expanded, setExpanded] = useState(false);
  const close = useCallback(() => setExpanded(false), []);
  const label = format === 'reel' ? `${name}'s reel` : `${name} spelled in periodic table elements`;

  return (
    <div className="relative flex h-[30vh] min-h-[220px] sm:h-[42vh] max-h-[460px] w-full items-center justify-center">
      {format === 'reel' && (
        <canvas ref={canvasRef} className={ready ? 'hidden' : MEDIA_CLASS} aria-label={`Recording ${name}'s reel`} />
      )}
      {ready && format === 'reel' && (
        <button type="button" onClick={() => setExpanded(true)} className="nb-focus flex h-full max-w-full items-center justify-center cursor-zoom-in" aria-label="View full size">
          <video key={ready.url} src={ready.url} className={MEDIA_CLASS} autoPlay loop muted playsInline aria-label={label} />
        </button>
      )}
      {ready && format !== 'reel' && (
        <button type="button" onClick={() => setExpanded(true)} className="nb-focus flex h-full max-w-full items-center justify-center cursor-zoom-in" aria-label="View full size">
          <img src={ready.url} alt={label} className={MEDIA_CLASS} />
        </button>
      )}
      {ready && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="nb-focus absolute bottom-1 right-1 flex items-center gap-1 rounded-md border-2 border-ink bg-white px-2 py-1 text-xs font-bold shadow-brutal-sm hover:bg-pop-yellow"
          aria-label="View full size"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
          Full size
        </button>
      )}
      {ready && expanded && <ShareLightbox url={ready.url} isVideo={format === 'reel'} label={label} onClose={close} />}
      {format !== 'reel' && media?.status === 'working' && (
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink border-t-transparent" aria-label="Drawing your image" />
      )}
      {media?.status === 'error' && (
        <p role="alert" className="rounded-md bg-pop-coral/20 px-2 py-1 text-sm font-semibold text-ink">
          Something went wrong. Pick the format again to retry.
        </p>
      )}
      {recording && (
        <div className="absolute inset-x-0 bottom-2 mx-auto flex w-fit items-center gap-2 rounded-md border-2 border-ink bg-white px-2.5 py-1 text-xs font-bold shadow-brutal-sm">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-pop-coral" aria-hidden="true" />
          Making your reel… {Math.round(progress * 100)}%
        </div>
      )}
    </div>
  );
};

export default ShareMediaPreview;
