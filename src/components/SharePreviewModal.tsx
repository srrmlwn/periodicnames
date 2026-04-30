import React, { useState, useEffect, useRef } from 'react';
import { ShareImageGenerator } from '../utils/ShareImageGenerator';
import { ShareVideoGenerator } from '../utils/ShareVideoGenerator';
import type { NameResult } from '../types';
import type { SharePlatform } from '../types/sharing';

interface SharePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: NameResult;
}

type Step = 'customize' | 'share';

const PROGRESS_LABELS = ['Customize', 'Share'] as const;

const CAPTION_PLACEHOLDERS = [
  'e.g. Born to be periodic',
  'e.g. Elementally yours',
  'e.g. Made of stardust',
  'e.g. Periodic and proud',
  'e.g. The element of surprise',
];

interface PlatformOption {
  id: SharePlatform;
  label: string;
  description: string;
}

const ALL_PLATFORMS: PlatformOption[] = [
  { id: 'x',         label: 'X Post',          description: '16:9 image' },
  { id: 'instagram', label: 'Instagram Post',   description: '1:1 image'  },
  { id: 'story',     label: 'Story',            description: '9:16 image' },
  { id: 'reel',      label: 'Reel (video)',     description: '9:16 video' },
];

const SharePreviewModal: React.FC<SharePreviewModalProps> = ({ isOpen, onClose, result }) => {
  const [step, setStep] = useState<Step>('customize');
  const [caption, setCaption] = useState('');
  const [showWatermark, setShowWatermark] = useState(true);
  const [platform, setPlatform] = useState<SharePlatform>('x');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  const [generateKey, setGenerateKey] = useState(0);

  const imageGenRef = useRef(new ShareImageGenerator());
  const videoGenRef = useRef(new ShareVideoGenerator());
  const imageUrlRef = useRef<string | null>(null);
  const videoUrlRef = useRef<string | null>(null);
  // Capture customize settings at the moment the user advances to step 2
  const captionRef = useRef('');
  const showWatermarkRef = useRef(true);
  const wasOpenRef = useRef(false);

  const supportsVideo = ShareVideoGenerator.isSupported();
  const platforms = supportsVideo ? ALL_PLATFORMS : ALL_PLATFORMS.filter(p => p.id !== 'reel');

  // Reset to step 1 each time the modal opens
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setStep('customize');
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  // Rotate caption placeholder while on step 1 with no input
  useEffect(() => {
    if (!isOpen || caption || step !== 'customize') return;
    const id = setInterval(
      () => setPlaceholderIdx(i => (i + 1) % CAPTION_PLACEHOLDERS.length),
      2500,
    );
    return () => clearInterval(id);
  }, [isOpen, caption, step]);

  // Generate image whenever step 2 is active and platform is not reel
  useEffect(() => {
    if (!isOpen || step !== 'share' || platform === 'reel') return;

    let cancelled = false;
    if (imageUrlRef.current) { URL.revokeObjectURL(imageUrlRef.current); imageUrlRef.current = null; }
    setImageBlob(null);
    setImageUrl(null);
    setImageError(false);
    setIsGeneratingImage(true);

    const gen = imageGenRef.current;
    const cap = captionRef.current || undefined;
    const watermark = showWatermarkRef.current;

    const generate = async () => {
      let blob: Blob;
      if (platform === 'x') blob = await gen.generateXImage(result, cap, watermark);
      else if (platform === 'instagram') blob = await gen.generateInstagramImage(result, cap, watermark);
      else if (platform === 'story') blob = await gen.generateStoryImage(result, cap, watermark);
      else return;

      if (cancelled) return;
      const url = URL.createObjectURL(blob);
      imageUrlRef.current = url;
      setImageBlob(blob);
      setImageUrl(url);
      setIsGeneratingImage(false);
    };

    generate().catch(err => {
      if (!cancelled) {
        console.error('Image generation failed:', err);
        setIsGeneratingImage(false);
        setImageError(true);
      }
    });

    return () => { cancelled = true; };
  }, [isOpen, step, platform, generateKey, result]);

  // Reset video state when leaving reel or closing
  useEffect(() => {
    if (platform !== 'reel' || !isOpen) {
      setVideoBlob(null);
      setVideoUrl(null);
      setIsRecording(false);
      setRecordProgress(0);
      if (videoUrlRef.current) { URL.revokeObjectURL(videoUrlRef.current); videoUrlRef.current = null; }
    }
  }, [platform, isOpen]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  const goToShare = () => {
    captionRef.current = caption;
    showWatermarkRef.current = showWatermark;
    setGenerateKey(k => k + 1);
    setStep('share');
  };

  const handleRecord = async () => {
    if (isRecording) return;
    if (videoUrlRef.current) { URL.revokeObjectURL(videoUrlRef.current); videoUrlRef.current = null; }
    setVideoBlob(null);
    setVideoUrl(null);
    setIsRecording(true);
    setRecordProgress(0);
    try {
      const blob = await videoGenRef.current.generateReelVideo(result, setRecordProgress);
      const url = URL.createObjectURL(blob);
      videoUrlRef.current = url;
      setVideoBlob(blob);
      setVideoUrl(url);
    } catch (err) {
      console.error('Video recording failed:', err);
    } finally {
      setIsRecording(false);
    }
  };

  const handleShareImage = async () => {
    if (!imageBlob) return;
    const slug = result.originalName.toLowerCase().replace(/\s+/g, '-');
    const filename = `periodicnames-${slug}-${platform}.png`;
    const file = new File([imageBlob], filename, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${result.originalName} in periodic table elements`,
          text: 'Try yours at periodicnames.com',
        });
        return;
      } catch { /* fall through to download */ }
    }
    downloadBlob(imageBlob, filename);
  };

  const handleDownloadVideo = () => {
    if (!videoBlob) return;
    const slug = result.originalName.toLowerCase().replace(/\s+/g, '-');
    downloadBlob(videoBlob, `periodicnames-${slug}-reel.webm`);
  };

  if (!isOpen) return null;

  const slug = result.originalName.toLowerCase().replace(/\s+/g, '-');
  const xText = encodeURIComponent(`"${result.originalName}" in periodic table elements — try yours:`);
  const xUrl = encodeURIComponent(`https://periodicnames.com/${slug}`);
  const xIntentUrl = `https://x.com/intent/tweet?text=${xText}&url=${xUrl}`;

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.canShare;
  const estimatedSecs = Math.ceil(videoGenRef.current.getEstimatedDurationMs(result) / 1000);
  const progressStep = step === 'customize' ? 0 : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative flex flex-col h-[560px] max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors duration-150"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Progress indicator */}
        <div className="flex items-center px-6 pt-5 pb-1 pr-12 shrink-0">
          {PROGRESS_LABELS.map((label, i) => {
            const done = i < progressStep;
            const active = i === progressStep;
            return (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors duration-200 ${
                    done || active ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-400'
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

        <div className="px-6 pb-6 pt-3 flex-1 overflow-y-auto">

          {/* ── Step 1: Customize ── */}
          {step === 'customize' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-gray-800">Share your name</h2>

              {/* Caption */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Caption (optional)
                </p>
                <input
                  type="text"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder={CAPTION_PLACEHOLDERS[placeholderIdx]}
                  maxLength={60}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-slate-400 text-gray-700 placeholder-gray-300"
                />
              </div>

              {/* Watermark toggle */}
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

              <button
                onClick={goToShare}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors duration-150"
              >
                Next — pick platform →
              </button>
            </div>
          )}

          {/* ── Step 2: Preview & Share ── */}
          {step === 'share' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep('customize')}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-150 text-sm flex items-center gap-0.5"
                >
                  <span className="text-xl leading-none">‹</span>
                  <span>Customize</span>
                </button>
                <h2 className="text-base font-bold text-gray-800 ml-1">Share to</h2>
              </div>

              {/* Platform dropdown */}
              <div className="relative">
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value as SharePlatform)}
                  className="w-full appearance-none px-3 py-2.5 pr-8 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-slate-400 cursor-pointer"
                >
                  {platforms.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.label} — {p.description}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Preview */}
              <div className="h-56 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                {platform !== 'reel' && (
                  <>
                    {isGeneratingImage && (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Generating…</span>
                      </div>
                    )}
                    {imageError && !isGeneratingImage && (
                      <span className="text-xs text-red-400">Generation failed — try again</span>
                    )}
                    {imageUrl && !isGeneratingImage && (
                      <img src={imageUrl} alt="Share preview" className="max-h-full max-w-full object-contain" />
                    )}
                  </>
                )}

                {platform === 'reel' && (
                  <>
                    {!isRecording && !videoUrl && (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-center text-gray-400 px-4">
                          Animated tile reveal · <span className="font-medium text-gray-500">~{estimatedSecs}s</span>
                        </span>
                      </div>
                    )}
                    {isRecording && (
                      <div className="flex flex-col items-center gap-3 w-full px-8">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-100"
                            style={{ width: `${Math.round(recordProgress * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">Recording…</span>
                      </div>
                    )}
                    {videoUrl && (
                      <video src={videoUrl} className="max-h-full max-w-full object-contain" controls autoPlay loop muted />
                    )}
                  </>
                )}
              </div>

              {/* X Post actions */}
              {platform === 'x' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={handleShareImage}
                      disabled={!imageBlob || isGeneratingImage}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 ${
                        imageBlob && !isGeneratingImage
                          ? 'bg-slate-800 text-white hover:bg-slate-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {canNativeShare ? 'Share image' : 'Download image'}
                    </button>
                    <a
                      href={xIntentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors duration-150 flex items-center gap-1.5 shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Post
                    </a>
                  </div>
                  <p className="text-[11px] text-gray-400 text-center">Attach the downloaded image when you post on X</p>
                </div>
              )}

              {/* Instagram Post actions */}
              {platform === 'instagram' && (
                <div className="space-y-2">
                  <button
                    onClick={handleShareImage}
                    disabled={!imageBlob || isGeneratingImage}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 ${
                      imageBlob && !isGeneratingImage
                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {canNativeShare ? 'Share image' : 'Download image'}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">Open Instagram → [+] → Post → select your image</p>
                </div>
              )}

              {/* Story actions */}
              {platform === 'story' && (
                <div className="space-y-2">
                  <button
                    onClick={handleShareImage}
                    disabled={!imageBlob || isGeneratingImage}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 ${
                      imageBlob && !isGeneratingImage
                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {canNativeShare ? 'Share image' : 'Download image'}
                  </button>
                  <p className="text-[11px] text-gray-400 text-center">Open Instagram → [+] → Story → select your image</p>
                </div>
              )}

              {/* Reel actions */}
              {platform === 'reel' && (
                <div className="space-y-2">
                  {!videoBlob ? (
                    <button
                      onClick={handleRecord}
                      disabled={isRecording}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 ${
                        isRecording
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {isRecording ? 'Recording…' : 'Record Reel'}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadVideo}
                        className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors duration-150 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download .webm
                      </button>
                      <button
                        onClick={handleRecord}
                        className="py-2.5 px-3 rounded-xl text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors duration-150"
                        title="Record again"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400 text-center">Open Instagram or TikTok → Reel → select your video</p>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default SharePreviewModal;
