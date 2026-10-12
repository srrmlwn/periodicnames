import React from 'react';
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

  return (
    <div className="relative flex h-[30vh] min-h-[220px] sm:h-[42vh] max-h-[460px] w-full items-center justify-center">
      {format === 'reel' && (
        <canvas ref={canvasRef} className={ready ? 'hidden' : MEDIA_CLASS} aria-label={`Recording ${name}'s reel`} />
      )}
      {ready && format === 'reel' && (
        <video key={ready.url} src={ready.url} className={MEDIA_CLASS} autoPlay loop muted playsInline controls aria-label={`${name}'s reel`} />
      )}
      {ready && format !== 'reel' && (
        <img src={ready.url} alt={`${name} spelled in periodic table elements`} className={MEDIA_CLASS} />
      )}
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
