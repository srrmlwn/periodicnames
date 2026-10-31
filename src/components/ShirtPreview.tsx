import React, { useEffect, useRef } from 'react';
import { ensureCanvasFonts } from '../utils/canvasTile';
import { SHIRT_VIEW_H, SHIRT_VIEW_W, drawShirt } from '../utils/shirtDrawing';
import type { ShirtDesign } from '../utils/shirtDrawing';

const RENDER_SCALE = 3;

const ShirtPreview: React.FC<ShirtDesign> = ({ result, color, placement, caption, captionPosition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const draw = async () => {
      await ensureCanvasFonts();
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
      ctx.clearRect(0, 0, SHIRT_VIEW_W, SHIRT_VIEW_H);
      drawShirt(ctx, { result, color, placement, caption, captionPosition });
    };
    draw();
    return () => { cancelled = true; };
  }, [result, color, placement, caption, captionPosition]);

  return (
    <canvas
      ref={canvasRef}
      width={SHIRT_VIEW_W * RENDER_SCALE}
      height={SHIRT_VIEW_H * RENDER_SCALE}
      className="block w-full max-w-[210px] sm:max-w-[340px] mx-auto h-auto"
      role="img"
      aria-label={`${color.name} t-shirt with ${result.originalName} printed on the ${placement === 'chest' ? 'chest' : 'front'}`}
    />
  );
};

export default ShirtPreview;
