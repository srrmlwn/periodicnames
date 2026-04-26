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

type Tab = SharePlatform | 'reel';

const IMAGE_PLATFORMS: { id: SharePlatform; label: string }[] = [
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
  const [tab, setTab] = useState<Tab>('x');
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  const imageGenRef = useRef(new ShareImageGenerator());
  const videoGenRef = useRef(new ShareVideoGenerator());
  const imageUrlRef = useRef<string | null>(null);
  const videoUrlRef = useRef<string | null>(null);

  const supportsVideo = ShareVideoGenerator.isSupported();

  // Auto-generate image when tab or result changes
  useEffect(() => {
    if (!isOpen || tab === 'reel') return;
    const platform = tab as SharePlatform;

    let cancelled = false;
    if (imageUrlRef.current) { URL.revokeObjectURL(imageUrlRef.current); imageUrlRef.current = null; }
    setImageBlob(null);
    setImageUrl(null);
    setIsGeneratingImage(true);

    const generate = async () => {
      const gen = imageGenRef.current;
      let blob: Blob;
      if (platform === 'x') blob = await gen.generateXImage(result);
      else if (platform === 'instagram') blob = await gen.generateInstagramImage(result);
      else blob = await gen.generateStoryImage(result);

      if (cancelled) return;
      const url = URL.createObjectURL(blob);
      imageUrlRef.current = url;
      setImageBlob(blob);
      setImageUrl(url);
      setIsGeneratingImage(false);
    };

    generate().catch(err => {
      if (!cancelled) { console.error('Image generation failed:', err); setIsGeneratingImage(false); }
    });

    return () => { cancelled = true; };
  }, [isOpen, tab, result]);

  // Reset video state when leaving reel tab or closing
  useEffect(() => {
    if (tab !== 'reel' || !isOpen) {
      setVideoBlob(null);
      setVideoUrl(null);
      setIsRecording(false);
      setRecordProgress(0);
      if (videoUrlRef.current) { URL.revokeObjectURL(videoUrlRef.current); videoUrlRef.current = null; }
    }
  }, [tab, isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

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
    if (!imageBlob || tab === 'reel') return;
    const slug = result.originalName.toLowerCase().replace(/\s+/g, '-');
    const filename = `periodic-names-${slug}-${tab}.png`;
    const file = new File([imageBlob], filename, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${result.originalName} in Periodic Table Elements`,
          text: `My name spelled with periodic table elements! Try yours at periodicnames.com`,
        });
        return;
      } catch { /* fall through */ }
    }
    downloadBlob(imageBlob, filename);
  };

  const handleDownloadVideo = () => {
    if (!videoBlob) return;
    const slug = result.originalName.toLowerCase().replace(/\s+/g, '-');
    downloadBlob(videoBlob, `periodic-names-${slug}-reel.webm`);
  };

  if (!isOpen) return null;

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.canShare;
  const estimatedSecs = Math.ceil(videoGenRef.current.getEstimatedDurationMs(result) / 1000);

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

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {IMAGE_PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => setTab(p.id)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                tab === p.id ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
          {supportsVideo && (
            <button
              onClick={() => setTab('reel')}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-colors duration-150 flex items-center justify-center gap-1 ${
                tab === 'reel' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Reel
            </button>
          )}
        </div>

        {/* Image preview */}
        {tab !== 'reel' && (
          <>
            <div
              className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-4 flex items-center justify-center mx-auto"
              style={{ aspectRatio: ASPECT[tab as SharePlatform], maxHeight: '280px', width: '100%' }}
            >
              {isGeneratingImage ? (
                <div className="flex flex-col items-center gap-2 text-gray-400 py-8">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Generating…</span>
                </div>
              ) : imageUrl ? (
                <img src={imageUrl} alt="Share preview" className="w-full h-full object-contain" />
              ) : null}
            </div>

            <button
              onClick={handleShareImage}
              disabled={!imageBlob || isGeneratingImage}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors duration-150 flex items-center justify-center gap-2 ${
                imageBlob && !isGeneratingImage
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
          </>
        )}

        {/* Reel tab */}
        {tab === 'reel' && (
          <>
            <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100 mb-4 flex items-center justify-center"
              style={{ aspectRatio: '1 / 1', maxHeight: '280px', width: '100%' }}
            >
              {!isRecording && !videoUrl && (
                <div className="flex flex-col items-center gap-3 text-gray-400 py-8">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-center text-gray-400 px-4">
                    Records the animated tile reveal<br />
                    <span className="font-medium text-gray-500">~{estimatedSecs}s video</span>
                  </span>
                </div>
              )}

              {isRecording && (
                <div className="flex flex-col items-center gap-3 text-gray-500 py-8 w-full px-8">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-100"
                      style={{ width: `${Math.round(recordProgress * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">Recording animation…</span>
                </div>
              )}

              {videoUrl && (
                <video
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  loop
                  muted
                />
              )}
            </div>

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
                {isRecording ? 'Recording…' : 'Record Animation'}
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

            <p className="mt-3 text-center text-xs text-gray-400">
              Upload to Instagram Reels, TikTok, or Twitter
            </p>
          </>
        )}
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
