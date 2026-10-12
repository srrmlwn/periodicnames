import React, { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import ShareMediaPreview from './ShareMediaPreview';
import ShareActions from './ShareActions';
import { CAPTION_EXAMPLES, CAPTION_EXAMPLE_INTERVAL_MS } from '../data/captionExamples';
import { reelMimeType, recordShareReel, renderShareImage, shareFileName, shareSlug } from '../utils/shareMedia';
import { primeShareAudio } from '../utils/shareAudio';
import type { ShareFormat } from '../utils/shareScene';
import type { NameResult } from '../types';
import type { ShareMedia } from '../types/sharing';

interface SharePreviewModalProps {
  onClose: () => void;
  result: NameResult;
}

const FORMATS: { id: ShareFormat; label: string; detail: string }[] = [
  { id: 'reel', label: 'Reel', detail: 'video' },
  { id: 'story', label: 'Story', detail: '9:16' },
  { id: 'post', label: 'Post', detail: '4:5' },
  { id: 'wide', label: 'Wide', detail: 'X / chat' },
];

const CAPTION_DEBOUNCE_MS = 600;

function detectFileShare(): boolean {
  try {
    return !!navigator.canShare?.({ files: [new File([''], 'test.png', { type: 'image/png' })] });
  } catch {
    return false;
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const chipClass = (active: boolean) =>
  `nb-focus flex flex-col items-center px-2 py-1.5 rounded-lg border-[3px] border-ink font-bold text-sm leading-tight shadow-brutal-sm transition-colors ${
    active ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-mist'
  }`;

const SharePreviewModal: React.FC<SharePreviewModalProps> = ({ onClose, result }) => {
  const [videoMime] = useState(reelMimeType);
  const [canShareFiles] = useState(detectFileShare);
  const [format, setFormat] = useState<ShareFormat>(videoMime ? 'reel' : 'story');
  const [caption, setCaption] = useState('');
  const [debouncedCaption, setDebouncedCaption] = useState('');
  const [exampleIdx, setExampleIdx] = useState(0);
  const [media, setMedia] = useState<ShareMedia | null>(null);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formats = videoMime ? FORMATS : FORMATS.filter(f => f.id !== 'reel');
  const mediaKey = `${format}|${debouncedCaption}`;
  const current = media?.key === mediaKey ? media : null;
  const readyUrl = current?.status === 'ready' ? current.url : null;

  useEffect(() => {
    const id = setTimeout(() => setDebouncedCaption(caption.trim()), CAPTION_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [caption]);

  useEffect(() => {
    if (caption) return;
    const id = setInterval(() => setExampleIdx(i => (i + 1) % CAPTION_EXAMPLES.length), CAPTION_EXAMPLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [caption]);

  useEffect(() => {
    const key = `${format}|${debouncedCaption}`;
    const ready = (blob: Blob) => setMedia({ key, status: 'ready', blob, url: URL.createObjectURL(blob) });
    setMedia({ key, status: 'working' });

    if (format !== 'reel') {
      let cancelled = false;
      renderShareImage(result, debouncedCaption, format)
        .then(blob => { if (!cancelled) ready(blob); })
        .catch(() => { if (!cancelled) setMedia({ key, status: 'error' }); });
      return () => { cancelled = true; };
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const controller = new AbortController();
    setProgress(0);
    recordShareReel(canvas, result, debouncedCaption, controller.signal, p => setProgress(Math.round(p * 50) / 50))
      .then(ready)
      .catch(err => { if (!controller.signal.aborted) { console.error(err); setMedia({ key, status: 'error' }); } });
    return () => controller.abort();
  }, [format, debouncedCaption, result]);

  useEffect(() => () => { if (readyUrl) URL.revokeObjectURL(readyUrl); }, [readyUrl]);

  const fileFor = (blob: Blob) => new File([blob], shareFileName(result.originalName, format, blob.type), { type: blob.type });

  const share = async () => {
    if (current?.status !== 'ready') return;
    const file = fileFor(current.blob);
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `${result.originalName} in periodic table elements` });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    downloadBlob(current.blob, file.name);
  };

  const download = () => {
    if (current?.status === 'ready') downloadBlob(current.blob, fileFor(current.blob).name);
  };

  const pickFormat = (f: ShareFormat) => {
    if (f === 'reel') primeShareAudio();
    setFormat(f);
  };

  return (
    <Modal isOpen onClose={onClose} label="Share your name" widthClass="max-w-3xl" className="max-h-[92vh] overflow-y-auto">
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="bg-mist border-b-[3px] md:border-b-0 md:border-r-[3px] border-ink rounded-t-[9px] md:rounded-tr-none md:rounded-l-[9px] px-4 py-5 sm:py-6 flex items-center justify-center">
          <ShareMediaPreview format={format} media={current} progress={progress} canvasRef={canvasRef} name={result.originalName} />
        </div>

        <div className="px-5 pt-5 pb-5 sm:pt-6 flex flex-col gap-4 sm:gap-5">
          <div className="pr-10">
            <h2 className="text-xl font-bold text-ink">Share your name</h2>
            <p className="text-sm text-muted mt-0.5">Pick a format, then send it anywhere.</p>
          </div>

          <fieldset>
            <legend className="nb-label">Format</legend>
            <div className="grid grid-cols-4 gap-2">
              {formats.map(f => (
                <button key={f.id} type="button" onClick={() => pickFormat(f.id)} aria-pressed={f.id === format} className={chipClass(f.id === format)}>
                  {f.label}
                  <span className={`text-[11px] font-semibold ${f.id === format ? 'text-white/75' : 'text-muted'}`}>{f.detail}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="nb-label">Line of text (optional)</span>
            <input
              className="nb-input"
              value={caption}
              maxLength={40}
              placeholder={`e.g. ${CAPTION_EXAMPLES[exampleIdx]}`}
              onChange={e => setCaption(e.target.value)}
            />
          </label>

          <ShareActions
            format={format}
            ready={current?.status === 'ready'}
            isWebm={!!videoMime?.startsWith('video/webm')}
            canShareFiles={canShareFiles}
            link={`https://periodicnames.com/${shareSlug(result.originalName)}`}
            shareText={`My name in periodic table elements 🧪 What's yours?`}
            onShare={share}
            onDownload={download}
          />
        </div>
      </div>
    </Modal>
  );
};

export default SharePreviewModal;
