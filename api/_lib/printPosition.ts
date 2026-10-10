export interface PrintPosition {
  area_width: number;
  area_height: number;
  width: number;
  height: number;
  top: number;
  left: number;
  limit_to_print_area: true;
}

const FRAME_WIDTH = 1800;
const FRAME_HEIGHT = 2400;

export function parsePrintPosition(input: unknown): PrintPosition | null {
  const value = typeof input === 'string' ? safeJson(input) : input;
  if (!value || typeof value !== 'object') return null;
  const p = value as Record<string, unknown>;
  const nums = ['width', 'height', 'top', 'left'].map(k => p[k]);
  if (!nums.every(n => typeof n === 'number' && Number.isFinite(n))) return null;
  const [width, height, top, left] = nums as number[];
  if (width <= 0 || height <= 0 || top < 0 || left < 0) return null;
  if (left + width > FRAME_WIDTH || top + height > FRAME_HEIGHT) return null;
  return {
    area_width: FRAME_WIDTH,
    area_height: FRAME_HEIGHT,
    width: Math.round(width),
    height: Math.round(height),
    top: Math.round(top),
    left: Math.round(left),
    limit_to_print_area: true,
  };
}

export function serializePrintPosition(p: PrintPosition): string {
  return JSON.stringify({ width: p.width, height: p.height, top: p.top, left: p.left });
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
