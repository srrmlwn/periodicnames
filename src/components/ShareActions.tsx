import React, { useState } from 'react';
import type { MediaState, ShareKind } from '../utils/shareMachine';
import { canShareLink, copyText, shareLink } from '../utils/shareFile';
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
    case 'ready': return canShareReady ? `Share ${noun}` : `Download ${noun}`;
  }
}

const ShareActions: React.FC<ShareActionsProps> = ({ kind, media, canShareReady, isWebm, notice, link, shareText, onCreate, onShare, onSave }) => {
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');
  const [linkShareable] = useState(() => canShareLink(link));
  const ready = media.status === 'ready';
  const busy = media.status === 'generating' || (kind === 'image' && media.status === 'idle');

  const copyLink = async () => {
    const ok = await copyText(link);
    setCopied(ok ? 'done' : 'failed');
    if (ok) track('share_link_copied');
    setTimeout(() => setCopied('idle'), 2500);
  };

  const shareTheLink = async () => {
    track('native_share_invoked', { format: 'link' });
    const outcome = await shareLink(link, shareText);
    if (outcome === 'shared') track('native_share_completed', { format: 'link' });
    else if (outcome === 'dismissed') track('native_share_dismissed', { format: 'link' });
    else await copyLink();
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
        {linkShareable && (
          <button type="button" onClick={shareTheLink} className={smallBtn}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1" />
            </svg>
            Share link
          </button>
        )}
        {ready && canShareReady && (
          <button type="button" onClick={onSave} className={smallBtn}>Download</button>
        )}
      </div>
      {copied === 'failed' && <p className="text-xs font-semibold text-muted text-center break-all select-all">{link}</p>}
    </div>
  );
};

export default ShareActions;
