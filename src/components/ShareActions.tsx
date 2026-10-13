import React, { useState } from 'react';
import type { MediaState, ShareKind } from '../utils/shareMachine';
import { copyText } from '../utils/shareFile';
import { track } from '../utils/analytics';

interface ShareActionsProps {
  kind: ShareKind;
  media: MediaState;
  canShareReady: boolean;
  isWebm: boolean;
  notice: string | null;
  link: string;
  shareText: string;
  onCreate: () => void;
  onShare: () => void;
  onSave: () => void;
}

const smallBtn = 'nb-btn bg-white px-3 py-2 text-sm flex-1';

function primaryLabel(kind: ShareKind, media: MediaState, canShareReady: boolean): string {
  const noun = kind === 'video' ? 'video' : 'image';
  switch (media.status) {
    case 'idle': return kind === 'video' ? 'Create video' : 'Preparing image…';
    case 'generating': return kind === 'video' ? 'Creating video…' : 'Preparing image…';
    case 'error': return 'Try again';
    case 'ready': return canShareReady ? `Share ${noun}` : `Save ${noun}`;
  }
}

const ShareActions: React.FC<ShareActionsProps> = ({ kind, media, canShareReady, isWebm, notice, link, shareText, onCreate, onShare, onSave }) => {
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');
  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(link)}`;
  const ready = media.status === 'ready';
  const busy = media.status === 'generating' || (kind === 'image' && media.status === 'idle');

  const copyLink = async () => {
    const ok = await copyText(link);
    setCopied(ok ? 'done' : 'failed');
    if (ok) track('share_link_copied');
    setTimeout(() => setCopied('idle'), 2500);
  };

  return (
    <div className="mt-auto flex flex-col gap-2.5">
      <button
        type="button"
        onClick={ready ? onShare : onCreate}
        disabled={busy}
        aria-busy={busy}
        className="nb-btn bg-pop-yellow w-full py-3 text-lg"
      >
        {primaryLabel(kind, media, canShareReady)}
      </button>
      {media.status === 'error' && (
        <p role="alert" className="rounded-md bg-pop-coral/20 px-2 py-1 text-sm font-semibold text-ink text-center">{media.message}</p>
      )}
      {notice && <p role="status" className="text-xs font-semibold text-ink text-center">{notice}</p>}
      {ready && isWebm && (
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
        {ready && canShareReady && (
          <button type="button" onClick={onSave} className={smallBtn}>Save</button>
        )}
      </div>
      {copied === 'failed' && <p className="text-xs font-semibold text-muted text-center break-all select-all">{link}</p>}
    </div>
  );
};

export default ShareActions;
