import React, { useEffect, useRef } from 'react';
import type { NameResult } from '../types';
import type { ShirtColor } from '../data/printProducts';
import { BRAND } from '../utils/colorSchemes';
import { ensureCanvasFonts } from '../utils/canvasTile';
import { PRINT_AREA_BELOW_COLLAR_IN, PRINT_FRAME, canvasMeasure, computePrintLayout, drawPrintDesign } from '../utils/printLayout';
import type { CaptionPosition, Placement } from '../utils/printLayout';

interface ShirtPreviewProps {
  result: NameResult;
  color: ShirtColor;
  placement: Placement;
  caption: string;
  captionPosition: CaptionPosition;
}

const VIEW_W = 400;
const VIEW_H = 440;
const UNITS_PER_IN = 13;
const FRAME_LEFT = VIEW_W / 2 - (PRINT_FRAME.widthIn * UNITS_PER_IN) / 2;
const COLLAR_Y = 45;
const FRAME_TOP = COLLAR_Y + PRINT_AREA_BELOW_COLLAR_IN * UNITS_PER_IN;
const RENDER_SCALE = 3;

const SHIRT_PATH = 'M140 20 L60 50 L10 140 L70 165 L70 430 L330 430 L330 165 L390 140 L340 50 L260 20 Q200 70 140 20 Z';
const COLLAR_PATH = 'M140 20 Q200 70 260 20';

const ShirtPreview: React.FC<ShirtPreviewProps> = ({ result, color, placement, caption, captionPosition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const draw = async () => {
      await ensureCanvasFonts();
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);

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
      ctx.save();
      ctx.translate(FRAME_LEFT + layout.position.left * unitsPerFramePx, FRAME_TOP + layout.position.top * unitsPerFramePx);
      drawPrintDesign(ctx, layout, UNITS_PER_IN, caption, color.dark);
      ctx.restore();
    };
    draw();
    return () => { cancelled = true; };
  }, [result, color, placement, caption, captionPosition]);

  return (
    <canvas
      ref={canvasRef}
      width={VIEW_W * RENDER_SCALE}
      height={VIEW_H * RENDER_SCALE}
      className="block w-full max-w-[210px] sm:max-w-[340px] mx-auto h-auto"
      role="img"
      aria-label={`${color.name} t-shirt with ${result.originalName} printed on the ${placement === 'chest' ? 'chest' : 'front'}`}
    />
  );
};

export default ShirtPreview;
