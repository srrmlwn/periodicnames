import React, { useRef, useState } from 'react';

interface ShareVideoPlayerProps {
  url: string;
  label: string;
  mediaClass: string;
  onExpand: () => void;
}

const controlClass = 'nb-focus flex items-center gap-1 rounded-md border-2 border-ink bg-white px-2 py-1 text-xs font-bold shadow-brutal-sm hover:bg-pop-yellow';

const ShareVideoPlayer: React.FC<ShareVideoPlayerProps> = ({ url, label, mediaClass, onExpand }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (video.paused) void video.play();
  };

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play();
  };

  return (
    <>
      <video key={url} ref={videoRef} src={url} className={`${mediaClass} cursor-zoom-in`} autoPlay loop muted playsInline aria-label={label} onClick={onExpand} />
      <div className="absolute inset-x-0 bottom-1 flex justify-center gap-1.5" role="group" aria-label="Video controls">
        <button type="button" onClick={toggleSound} className={controlClass} aria-pressed={!muted}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5L6 9H3v6h3l5 4V5z" />
            {muted
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 9l5 6m0-6l-5 6" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />}
          </svg>
          {muted ? 'Sound off' : 'Sound on'}
        </button>
        <button type="button" onClick={replay} className={controlClass}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h5M4.6 15a8 8 0 101.9-8.3L4 9" />
          </svg>
          Replay
        </button>
        <button type="button" onClick={onExpand} className={controlClass} aria-label="Play full size">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
          Full size
        </button>
      </div>
    </>
  );
};

export default ShareVideoPlayer;
