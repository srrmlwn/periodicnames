import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Modal from './Modal';
import ShareMediaPreview from './ShareMediaPreview';
import ShareFormatPicker from './ShareFormatPicker';
import ShareActions from './ShareActions';
import { estimateReelMs, reelMimeType, recordShareReel, renderShareImage, shareFileName, shareSlug } from '../utils/shareMedia';
import type { ReelProgress } from '../utils/shareMedia';
import { primeShareAudio } from '../utils/shareAudio';
import { canShareFile, downloadFile, shareOrDownload } from '../utils/shareFile';
import { canStart, formatForKey, initialShareState, mediaFor, mediaKeyFor, shareReducer } from '../utils/shareMachine';
import type { ImageFormat, MediaKey, ShareKind } from '../utils/shareMachine';
import { track } from '../utils/analytics';
import type { NameResult } from '../types';

interface SharePreviewModalProps {
  onClose: () => void;
  result: NameResult;
}

const FAILURE_MESSAGE: Record<'video' | 'image', string> = {
  video: "We couldn't record the video. Try again, or share an image instead.",
  image: "We couldn't draw the image. Try again.",
};

const SAVED_NOTICE: Record<ShareKind, string> = {
  video: 'Download started. To post it, open Instagram or TikTok and pick the video from your files.',
  image: 'Download started. To post it, open your app and pick the image from your photos or files.',
};

const SharePreviewModal: React.FC<SharePreviewModalProps> = ({ onClose, result }) => {
  const [videoMime] = useState(reelMimeType);
  const [videoMs] = useState(() => estimateReelMs(result));
  const [state, dispatch] = useReducer(shareReducer, videoMime !== null, initialShareState);
  const [liveCanvas, setLiveCanvas] = useState<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState<ReelProgress | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;
  const inflight = useRef(new Set<MediaKey>());
  const objectUrls = useRef(new Set<string>());
  const mounted = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const key = mediaKeyFor(state.kind, state.imageFormat);
  const media = mediaFor(state, key);
  const posterMedia = mediaFor(state, 'image-story');
  const poster = state.kind === 'video' && posterMedia.status === 'ready' ? posterMedia.url : null;

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    abortRef.current = controller;
    const urls = objectUrls.current;
    return () => {
      mounted.current = false;
      controller.abort();
      urls.forEach(url => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  useEffect(() => {
    track('share_modal_opened', { video_supported: videoMime !== null });
  }, [videoMime]);

  const generate = useCallback((k: MediaKey) => {
    if (inflight.current.has(k) || !canStart(stateRef.current, k)) return;
    inflight.current.add(k);
    dispatch({ type: 'start', key: k });
    const format = formatForKey(k);
    const startedAt = performance.now();
    track('media_generation_started', { format });

    let job: Promise<Blob>;
    if (k === 'video') {
      primeShareAudio();
      setProgress(null);
      job = recordShareReel(result, {
        signal: abortRef.current?.signal,
        onStart: (canvas, totalMs) => { setLiveCanvas(canvas); setProgress({ elapsedMs: 0, totalMs }); },
        onProgress: p => setProgress(prev => (prev && Math.floor(prev.elapsedMs / 1000) === Math.floor(p.elapsedMs / 1000) ? prev : p)),
      });
    } else {
      job = renderShareImage(result, format);
    }

    job
      .then(blob => {
        if (blob.size === 0) throw new Error('Empty file');
        if (!mounted.current) return;
        const url = URL.createObjectURL(blob);
        objectUrls.current.add(url);
        dispatch({ type: 'succeed', key: k, blob, url });
        track('media_generation_completed', {
          format, duration_ms: Math.round(performance.now() - startedAt), size_kb: Math.round(blob.size / 1024), mime: blob.type,
        });
      })
      .catch((err: unknown) => {
        if (!mounted.current) return;
        dispatch({ type: 'fail', key: k, message: FAILURE_MESSAGE[k === 'video' ? 'video' : 'image'] });
        track('media_generation_failed', { format, error: err instanceof Error ? err.name || err.message : 'unknown' });
      })
      .finally(() => {
        inflight.current.delete(k);
        if (k === 'video') setLiveCanvas(null);
      });
  }, [result]);

  useEffect(() => {
    generate('image-story');
    if (state.kind === 'image') generate(key);
  }, [generate, key, state.kind]);

  const readyFile = useMemo(() => {
    if (media.status !== 'ready') return null;
    const type = media.blob.type || 'application/octet-stream';
    return new File([media.blob], shareFileName(result.originalName, formatForKey(key), type), { type });
  }, [media, key, result.originalName]);
  const canShareReady = readyFile !== null && canShareFile(readyFile);

  const share = async () => {
    if (!readyFile) return;
    setNotice(null);
    const props = { format: formatForKey(key) };
    if (canShareReady) track('native_share_invoked', props);
    const res = await shareOrDownload(readyFile, downloadFile);
    if (res.outcome === 'shared') track('native_share_completed', props);
    else if (res.outcome === 'dismissed') track('native_share_dismissed', props);
    else {
      track('media_downloaded', { ...props, reason: res.reason });
      setNotice(res.reason === 'share-failed'
        ? "Couldn't open the share sheet, so the download started instead."
        : SAVED_NOTICE[state.kind]);
    }
  };

  const save = () => {
    if (!readyFile) return;
    downloadFile(readyFile);
    track('media_downloaded', { format: formatForKey(key), reason: 'save' });
    setNotice(SAVED_NOTICE[state.kind]);
  };

  const pickKind = (kind: ShareKind) => {
    setNotice(null);
    track('share_format_selected', { kind, format: kind === 'video' ? 'reel' : state.imageFormat });
    dispatch({ type: 'selectKind', kind });
  };

  const pickImageFormat = (format: ImageFormat) => {
    setNotice(null);
    track('share_format_selected', { kind: 'image', format });
    dispatch({ type: 'selectImageFormat', format });
  };

  return (
    <Modal isOpen onClose={onClose} label="Your name, ready to share" widthClass="max-w-3xl" className="max-h-[94dvh] overflow-y-auto">
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="bg-mist border-b-[3px] md:border-b-0 md:border-r-[3px] border-ink rounded-t-[9px] md:rounded-tr-none md:rounded-l-[9px] px-4 py-4 sm:py-6 flex items-center justify-center">
          <ShareMediaPreview kind={state.kind} media={media} poster={poster} liveCanvas={liveCanvas} progress={progress} name={result.originalName} />
        </div>

        <div className="px-5 pt-4 pb-5 sm:pt-6 flex flex-col gap-3 sm:gap-4">
          <div className="pr-10">
            <h2 className="text-lg sm:text-xl font-bold text-ink">Your name, ready to share</h2>
            <p className="hidden sm:block text-sm text-muted mt-0.5">Pick a video or an image, then share or download it.</p>
          </div>
          <ShareFormatPicker
            kind={state.kind}
            imageFormat={state.imageFormat}
            videoSupported={videoMime !== null}
            videoSeconds={Math.round(videoMs / 1000)}
            onKind={pickKind}
            onImageFormat={pickImageFormat}
          />
          <ShareActions
            kind={state.kind}
            media={media}
            canShareReady={canShareReady}
            isWebm={media.status === 'ready' && media.blob.type.startsWith('video/webm')}
            notice={notice}
            link={`https://periodicnames.com/${shareSlug(result.originalName)}`}
            shareText="My name in periodic table elements 🧪 What's yours?"
            onCreate={() => generate(key)}
            onShare={share}
            onSave={save}
          />
        </div>
      </div>
    </Modal>
  );
};

export default SharePreviewModal;
