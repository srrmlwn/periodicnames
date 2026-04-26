import type { SharePlatform } from '../types/sharing';

export interface ImageDimensions {
  width: number;
  height: number;
}

export function getDimensions(platform: SharePlatform): ImageDimensions {
  switch (platform) {
    case 'x':
      return { width: 1200, height: 675 };
    case 'instagram':
      return { width: 1080, height: 1080 };
    case 'story':
      return { width: 1080, height: 1920 };
    default:
      return { width: 1200, height: 675 };
  }
} 