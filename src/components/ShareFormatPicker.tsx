import React from 'react';
import type { ImageFormat, ShareKind } from '../utils/shareMachine';

interface ShareFormatPickerProps {
  kind: ShareKind;
  imageFormat: ImageFormat;
  videoSupported: boolean;
  videoSeconds: number;
  onKind: (kind: ShareKind) => void;
  onImageFormat: (format: ImageFormat) => void;
}

const IMAGE_FORMATS: { id: ImageFormat; label: string; detail: string }[] = [
  { id: 'story', label: 'Story', detail: '9:16' },
  { id: 'post', label: 'Post', detail: '4:5' },
  { id: 'wide', label: 'Wide', detail: 'links' },
];

const kindClass = (active: boolean) =>
  `nb-focus flex items-center justify-center gap-2 rounded-lg border-[3px] border-ink px-3 py-2.5 font-bold shadow-brutal-sm transition-colors ${
    active ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-mist'
  } disabled:cursor-not-allowed disabled:opacity-50`;

const sizeClass = (active: boolean) =>
  `nb-focus rounded-md border-2 border-ink px-2.5 py-1 text-xs font-bold transition-colors ${
    active ? 'bg-pop-yellow text-ink' : 'bg-white text-ink hover:bg-mist'
  }`;

const ShareFormatPicker: React.FC<ShareFormatPickerProps> = ({ kind, imageFormat, videoSupported, videoSeconds, onKind, onImageFormat }) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="sr-only">Share as</legend>
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => onKind('video')} disabled={!videoSupported} aria-pressed={kind === 'video'} className={kindClass(kind === 'video')}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
        Video
      </button>
      <button type="button" onClick={() => onKind('image')} aria-pressed={kind === 'image'} className={kindClass(kind === 'image')}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth={2.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 16l5-5 4 4 3-3 6 6" />
        </svg>
        Image
      </button>
    </div>
    <div className="flex min-h-[30px] items-center justify-center gap-2">
      {kind === 'video' ? (
        <p className="text-xs font-semibold text-muted">
          {videoSupported ? `9:16 · about ${videoSeconds}s · with sound · for Reels & TikTok` : "This browser can't record video. Images work everywhere."}
        </p>
      ) : (
        <div role="group" aria-label="Image size" className="flex gap-2">
          {IMAGE_FORMATS.map(f => (
            <button key={f.id} type="button" onClick={() => onImageFormat(f.id)} aria-pressed={f.id === imageFormat} className={sizeClass(f.id === imageFormat)}>
              {f.label} <span className="font-semibold opacity-70">{f.detail}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  </fieldset>
);

export default ShareFormatPicker;
