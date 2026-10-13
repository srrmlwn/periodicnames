import type { ShareFormat } from './shareScene';

export type ShareKind = 'video' | 'image';
export type ImageFormat = 'story' | 'post' | 'wide';
export type MediaKey = 'video' | 'image-story' | 'image-post' | 'image-wide';

export type MediaState =
  | { status: 'idle' }
  | { status: 'generating' }
  | { status: 'ready'; blob: Blob; url: string }
  | { status: 'error'; message: string };

export interface ShareState {
  kind: ShareKind;
  imageFormat: ImageFormat;
  media: Partial<Record<MediaKey, MediaState>>;
}

export type ShareAction =
  | { type: 'selectKind'; kind: ShareKind }
  | { type: 'selectImageFormat'; format: ImageFormat }
  | { type: 'start'; key: MediaKey }
  | { type: 'succeed'; key: MediaKey; blob: Blob; url: string }
  | { type: 'fail'; key: MediaKey; message: string };

const IDLE: MediaState = { status: 'idle' };

export function initialShareState(videoSupported: boolean): ShareState {
  return { kind: videoSupported ? 'video' : 'image', imageFormat: 'story', media: {} };
}

export function mediaKeyFor(kind: ShareKind, imageFormat: ImageFormat): MediaKey {
  return kind === 'video' ? 'video' : `image-${imageFormat}`;
}

export function formatForKey(key: MediaKey): ShareFormat {
  return key === 'video' ? 'reel' : (key.slice('image-'.length) as ImageFormat);
}

export function mediaFor(state: ShareState, key: MediaKey): MediaState {
  return state.media[key] ?? IDLE;
}

export function canStart(state: ShareState, key: MediaKey): boolean {
  const { status } = mediaFor(state, key);
  return status === 'idle' || status === 'error';
}

export function shareReducer(state: ShareState, action: ShareAction): ShareState {
  switch (action.type) {
    case 'selectKind':
      return state.kind === action.kind ? state : { ...state, kind: action.kind };
    case 'selectImageFormat':
      return state.imageFormat === action.format ? state : { ...state, imageFormat: action.format };
    case 'start':
      if (!canStart(state, action.key)) return state;
      return { ...state, media: { ...state.media, [action.key]: { status: 'generating' } } };
    case 'succeed':
      if (mediaFor(state, action.key).status !== 'generating') return state;
      return { ...state, media: { ...state.media, [action.key]: { status: 'ready', blob: action.blob, url: action.url } } };
    case 'fail':
      if (mediaFor(state, action.key).status !== 'generating') return state;
      return { ...state, media: { ...state.media, [action.key]: { status: 'error', message: action.message } } };
  }
}
