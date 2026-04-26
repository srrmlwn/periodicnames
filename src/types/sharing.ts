import type { NameResult } from './index';

export type SharePlatform = 'x' | 'instagram' | 'story';

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