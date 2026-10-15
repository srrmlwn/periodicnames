import React, { useCallback, useEffect, useRef, useState } from 'react';
import ShareLightbox from './ShareLightbox';
import ShareVideoPlayer from './ShareVideoPlayer';
import type { MediaState, ShareKind } from '../utils/shareMachine';

interface ShareMediaPreviewProps {
  kind: ShareKind;
  media: MediaState;
  poster: string | null;
  liveCanvas: HTMLCanvasElement | null;
  progress: { elapsedMs: number; totalMs: number } | null;
  name: string;
}

interface LiveCanvasProps {
  canvas: HTMLCanvasElement;
}

const MEDIA_CLASS = 'block max-h-full max-w-full w-auto h-auto rounded-lg border-[3px] border-ink shadow-brutal bg-white';
const CLICKABLE = 'nb-focus flex h-full max-w-full items-center justify-center cursor-zoom-in';

const LiveCanvas: React.FC<LiveCanvasProps> = ({ canvas }) => {
  const holder = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    canvas.className = MEDIA_CLASS;
    canvas.setAttribute('aria-label', 'Your video, being created');
    el.appendChild(canvas);
    return () => { canvas.remove(); };
  }, [canvas]);
  return <div ref={holder} className="flex h-full max-w-full items-center justify-center" />;
};

const ShareMediaPreview: React.FC<ShareMediaPreviewProps> = ({ kind, media, poster, liveCanvas, progress, name }) => {
  const [expanded, setExpanded] = useState(false);
  const close = useCallback(() => setExpanded(false), []);
  const ready = media.status === 'ready' ? media : null;
  const isVideo = kind === 'video';
  const label = isVideo ? `${name}'s video` : `${name} spelled in periodic table elements`;
  const showLive = isVideo && media.status === 'generating' && liveCanvas;
  const stillUrl = ready ? (isVideo ? null : ready.url) : poster;

  return (
    <div className="relative flex h-[44vh] min-h-[240px] max-h-[480px] md:h-[62vh] md:max-h-[600px] w-full items-center justify-center">
      {ready && isVideo && (
        <div className="flex h-full max-w-full items-center justify-center">
          <ShareVideoPlayer url={ready.url} label={label} mediaClass={MEDIA_CLASS} onExpand={() => setExpanded(true)} />
        </div>
      )}
      {showLive && <LiveCanvas canvas={liveCanvas} />}
      {!showLive && stillUrl && (ready ? (
        <button type="button" onClick={() => setExpanded(true)} className={CLICKABLE} aria-label="View full size">
          <img src={stillUrl} alt={label} className={MEDIA_CLASS} />
        </button>
      ) : (
        <div className="flex h-full max-w-full items-center justify-center">
          <img src={stillUrl} alt={isVideo ? `Last frame of ${label}` : label} className={`${MEDIA_CLASS} ${isVideo ? 'opacity-40' : ''}`} />
        </div>
      ))}
      {!showLive && !stillUrl && !ready && media.status !== 'error' && (
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink border-t-transparent" role="status" aria-label="Drawing preview" />
      )}

      {isVideo && media.status !== 'generating' && !ready && poster && (
        <span className="pointer-events-none absolute inset-x-0 top-[64%] mx-auto flex w-fit max-w-[90%] -translate-y-1/2 flex-col items-center gap-1 rounded-lg border-[3px] border-ink bg-white px-4 py-3 text-center shadow-brutal">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          <span className="text-sm font-bold leading-tight">Tap “Create video” to record your reel</span>
        </span>
      )}
      {isVideo && media.status === 'generating' && progress && (
        <div className="absolute inset-x-0 bottom-1 mx-auto flex w-fit items-center gap-2 rounded-md border-2 border-ink bg-white px-2.5 py-1 text-xs font-bold shadow-brutal-sm" role="status">
          <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-pop-coral" aria-hidden="true" />
          Recording {Math.floor(progress.elapsedMs / 1000)}s of {Math.ceil(progress.totalMs / 1000)}s
        </div>
      )}
      {ready && !isVideo && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="nb-focus absolute bottom-1 right-1 flex items-center gap-1 rounded-md border-2 border-ink bg-white px-2 py-1 text-xs font-bold shadow-brutal-sm hover:bg-pop-yellow"
          aria-label={isVideo ? 'Play full size' : 'View full size'}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
          Full size
        </button>
      )}
      {ready && expanded && <ShareLightbox url={ready.url} isVideo={isVideo} label={label} onClose={close} />}
    </div>
  );
};

export default ShareMediaPreview;
