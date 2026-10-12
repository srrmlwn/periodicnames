import React, { useState } from 'react';
import type { ShareFormat } from '../utils/shareScene';

interface ShareActionsProps {
  format: ShareFormat;
  ready: boolean;
  isWebm: boolean;
  canShareFiles: boolean;
  link: string;
  shareText: string;
  onShare: () => void;
  onDownload: () => void;
}

const HINTS: Record<ShareFormat, { phone: string; desktop: string }> = {
  reel: {
    phone: 'Pick Instagram → Reel, or TikTok, WhatsApp… It has sound, too.',
    desktop: 'Saves a video with sound. Send it to your phone and post it as a Reel.',
  },
  story: { phone: 'Pick Instagram → Story.', desktop: 'Saves a 9:16 image for Instagram or Snapchat stories.' },
  post: { phone: 'Pick Instagram → Post.', desktop: 'Saves a 4:5 image, the size Instagram feeds show biggest.' },
  wide: { phone: 'Best for X, LinkedIn and group chats.', desktop: 'Best for X, LinkedIn and group chats.' },
};

const smallBtn = 'nb-btn bg-white px-3 py-2 text-sm flex-1';

const ShareActions: React.FC<ShareActionsProps> = ({ format, ready, isWebm, canShareFiles, link, shareText, onShare, onDownload }) => {
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');
  const isVideo = format === 'reel';
  const noun = isVideo ? 'video' : 'image';
  const primary = canShareFiles ? `Share ${noun}` : `Download ${noun}`;
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(link)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied('done');
    } catch {
      setCopied('failed');
    }
    setTimeout(() => setCopied('idle'), 2000);
  };

  return (
    <div className="mt-auto flex flex-col gap-3">
      <button type="button" onClick={onShare} disabled={!ready} className="nb-btn bg-pop-yellow w-full py-3 text-lg">
        {ready ? primary : isVideo ? 'Making your reel…' : 'Drawing…'}
      </button>
      <p className="-mt-1 text-xs font-medium text-muted text-center">
        {canShareFiles ? HINTS[format].phone : HINTS[format].desktop}
      </p>
      {isVideo && isWebm && ready && (
        <p className="rounded-md bg-pop-yellow/30 px-2 py-1 text-xs font-semibold text-ink text-center">
          This browser saves WebM, which Instagram may reject. Chrome or Safari save MP4.
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={copyLink} className={smallBtn}>
          {copied === 'done' ? 'Link copied!' : copied === 'failed' ? "Couldn't copy" : 'Copy link'}
        </button>
        <a href={xUrl} target="_blank" rel="noopener noreferrer" className={smallBtn}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Post
        </a>
        {canShareFiles && (
          <button type="button" onClick={onDownload} disabled={!ready} className={smallBtn}>
            Save
          </button>
        )}
      </div>
    </div>
  );
};

export default ShareActions;
