import type { NameResult } from '../types';
import type { ShirtColor } from '../data/printProducts';
import { BRAND } from './colorSchemes';
import { ensureCanvasFonts } from './canvasTile';
import { PRINT_AREA_BELOW_COLLAR_IN, PRINT_FRAME, canvasMeasure, computePrintLayout, drawPrintDesign } from './printLayout';
import type { CaptionPosition, Placement } from './printLayout';

export interface ShirtDesign {
  result: NameResult;
  color: ShirtColor;
  placement: Placement;
  caption: string;
  captionPosition: CaptionPosition;
}

export const SHIRT_VIEW_W = 400;
export const SHIRT_VIEW_H = 400;
const UNITS_PER_IN = 13;
const FRAME_LEFT = SHIRT_VIEW_W / 2 - (PRINT_FRAME.widthIn * UNITS_PER_IN) / 2;
const COLLAR_Y = 57.5;
const FRAME_TOP = COLLAR_Y + PRINT_AREA_BELOW_COLLAR_IN * UNITS_PER_IN;
const IMAGE_PX = 900;
const CLOSEUP_MIN_H = 290;
const CLOSEUP_MARGIN_BELOW = 80;

const SHIRT_PATH = 'M153.2 12.0 L76.5 28.9 L15.4 109.5 L53.1 143.3 L70.0 122.5 L70.0 389.0 L330.0 389.0 L330.0 122.5 L346.9 143.3 L384.6 109.5 L323.5 28.9 L246.8 12.0 C244.2 41.9 223.4 57.5 200.0 57.5 C176.6 57.5 155.8 41.9 153.2 12.0 Z';
const COLLAR_PATH = 'M153.2 12.0 Q200.0 26.3 246.8 12.0 M162.3 15.2 C164.9 36.7 181.8 47.8 200.0 47.8 C218.2 47.8 235.1 36.7 237.7 15.2';

export function drawShirt(ctx: CanvasRenderingContext2D, { result, color, placement, caption, captionPosition }: ShirtDesign): number {
  const shirt = new Path2D(SHIRT_PATH);
  ctx.fillStyle = color.hex;
  ctx.fill(shirt);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = BRAND.ink;
  ctx.stroke(shirt);
  ctx.globalAlpha = color.dark ? 1 : 0.25;
  ctx.stroke(new Path2D(COLLAR_PATH));
  ctx.globalAlpha = 1;

  const layout = computePrintLayout(result, caption, placement, canvasMeasure(ctx), captionPosition);
  const unitsPerFramePx = UNITS_PER_IN / PRINT_FRAME.ppi;
  const designTop = FRAME_TOP + layout.position.top * unitsPerFramePx;
  ctx.save();
  ctx.translate(FRAME_LEFT + layout.position.left * unitsPerFramePx, designTop);
  drawPrintDesign(ctx, layout, UNITS_PER_IN, caption, color.dark);
  ctx.restore();
  return designTop + layout.position.height * unitsPerFramePx;
}

export async function renderShirtImage(design: ShirtDesign): Promise<Blob> {
  await ensureCanvasFonts();
  const canvas = document.createElement('canvas');
  canvas.width = IMAGE_PX;
  canvas.height = IMAGE_PX;
  const ctx = canvas.getContext('2d')!;

  const scratch = document.createElement('canvas').getContext('2d')!;
  const designBottom = drawShirt(scratch, design);
  const side = Math.min(SHIRT_VIEW_W, Math.max(CLOSEUP_MIN_H, designBottom + CLOSEUP_MARGIN_BELOW));
  const scale = IMAGE_PX / side;

  ctx.fillStyle = BRAND.mist;
  ctx.fillRect(0, 0, IMAGE_PX, IMAGE_PX);
  ctx.scale(scale, scale);
  ctx.translate((side - SHIRT_VIEW_W) / 2, 0);
  drawShirt(ctx, design);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Shirt image could not be drawn'))), 'image/png');
  });
}
