import type { NameResult } from './index';

export type ImagePlatform = 'x' | 'instagram' | 'story';
export type SharePlatform = ImagePlatform | 'reel';

export interface ShareButtonProps {
  platform: SharePlatform;
  onClick: () => void;
  className?: string;
}

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: NameResult;
}

export interface ShareEvent {
  platform: SharePlatform;
  result: NameResult;
  timestamp: Date;
  userAgent: string;
  customMessage?: string;
  imageGenerated: boolean;
}
