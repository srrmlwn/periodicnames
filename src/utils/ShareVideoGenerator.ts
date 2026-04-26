import type { NameResult } from '../types';
import type { Element } from '../data/elements';
import { createElementLayout } from './elementRenderer';
import type { ElementRenderItem } from './elementRenderer';
import { getCategoryColor, getCategoryBorderColor, getFakeElementColor, getFakeElementBorderColor } from './colorSchemes';

const TITLE_COLORS = ['#e03030', '#f97316', '#2563eb', '#059669', '#7c3aed', '#0284c7', '#db2777'];
const STAGGER_MS = 65;
const POP_MS = 450;
const HOLD_MS = 1000;
const CANVAS_SIZE = 1080;
const FPS = 30;

interface TileAnim { scale: number; opacity: number; dy: number }

// Replicates the tilePop CSS keyframes: 0% 0.5/0/8, 60% 1.1/1/-2, 80% 0.95/1/0, 100% 1/1/0
function animForProgress(t: number): TileAnim {
  if (t <= 0) return { scale: 0.5, opacity: 0, dy: 8 };
  if (t >= 1) return { scale: 1, opacity: 1, dy: 0 };
  type KF = [number, number, number, number];
  const kfs: KF[] = [[0, 0.5, 0, 8], [0.6, 1.1, 1, -2], [0.8, 0.95, 1, 0], [1, 1, 1, 0]];
  let i = 0;
  while (i < kfs.length - 2 && kfs[i + 1][0] <= t) i++;
  const [t0, s0, a0, y0] = kfs[i];
  const [t1, s1, a1, y1] = kfs[i + 1];
  const f = (t - t0) / (t1 - t0);
  return { scale: s0 + (s1 - s0) * f, opacity: a0 + (a1 - a0) * f, dy: y0 + (y1 - y0) * f };
}

export class ShareVideoGenerator {
  static isSupported(): boolean {
    if (typeof MediaRecorder === 'undefined') return false;
    return (
      MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ||
      MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ||
      MediaRecorder.isTypeSupported('video/webm')
    );
  }

  getEstimatedDurationMs(result: NameResult): number {
    const numTiles = result.orderedElements.filter(e => e.symbol !== ' ').length;
    return Math.max(numTiles - 1, 0) * STAGGER_MS + POP_MS + HOLD_MS;
  }

  async generateReelVideo(
    result: NameResult,
    onProgress?: (ratio: number) => void
  ): Promise<Blob> {
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const mimeType =
      ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(
        m => MediaRecorder.isTypeSupported(m)
      ) ?? 'video/webm';

    const stream = canvas.captureStream(FPS);
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    const totalDuration = this.getEstimatedDurationMs(result);

    return new Promise((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
      recorder.onerror = reject;
      recorder.start(100);
      this.runAnimation(canvas, result, totalDuration, onProgress, () => {
        recorder.requestData();
        recorder.stop();
        stream.getTracks().forEach(t => t.stop());
      });
    });
  }

  private runAnimation(
    canvas: HTMLCanvasElement,
    result: NameResult,
    totalDuration: number,
    onProgress: ((ratio: number) => void) | undefined,
    onComplete: () => void
  ): void {
    const ctx = canvas.getContext('2d')!;
    const layout = createElementLayout(result);

    const tileSize = 110;
    const tileGap = 10;
    const wordGap = 22;
    const rowGap = 12;
    const padding = 80;
    const usableWidth = CANVAS_SIZE - padding * 2;

    const rows = this.buildWordRows(layout.items, tileSize, tileGap, wordGap, usableWidth);
    const totalRowsHeight = rows.length * tileSize + Math.max(0, rows.length - 1) * rowGap;

    // Assign stagger start times per tile (non-space only)
    const tileStarts = new Map<ElementRenderItem, number>();
    let idx = 0;
    layout.items.forEach(item => {
      if (item.type !== 'space') { tileStarts.set(item, idx++ * STAGGER_MS); }
    });

    const startEpoch = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startEpoch;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const titleSize = 68;
      const titleY = padding + titleSize;
      this.drawColorfulTitle(ctx, 'Periodic Names', CANVAS_SIZE / 2, titleY, titleSize);

      const subtitleSize = 34;
      const subtitleY = titleY + titleSize * 0.15 + subtitleSize + 16;
      ctx.font = `700 ${subtitleSize}px "Nunito", Arial, sans-serif`;
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(result.originalName, CANVAS_SIZE / 2, subtitleY);

      const topUsed = subtitleY + subtitleSize * 0.3 + 36;
      const tilesStartY = topUsed + Math.max(0, (CANVAS_SIZE - 60 - topUsed - totalRowsHeight) / 2);

      rows.forEach((row, ri) => {
        let rowWidth = 0;
        row.forEach((word, wi) => {
          if (wi > 0) rowWidth += wordGap;
          rowWidth += word.length * tileSize + Math.max(0, word.length - 1) * tileGap;
        });

        let x = (CANVAS_SIZE - rowWidth) / 2;
        const y = tilesStartY + ri * (tileSize + rowGap);

        row.forEach((word, wi) => {
          if (wi > 0) x += wordGap;
          word.forEach((item, ti) => {
            if (ti > 0) x += tileGap;
            const start = tileStarts.get(item) ?? 0;
            const progress = Math.min(1, Math.max(0, (elapsed - start) / POP_MS));
            const anim = animForProgress(progress);
            this.drawAnimatedTile(ctx, item, x, y, tileSize, anim);
            x += tileSize;
          });
        });
      });

      ctx.font = `600 22px "Nunito", Arial, sans-serif`;
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('periodicnames.com', CANVAS_SIZE / 2, CANVAS_SIZE - 28);

      onProgress?.(Math.min(1, elapsed / totalDuration));

      if (elapsed < totalDuration) {
        requestAnimationFrame(frame);
      } else {
        requestAnimationFrame(onComplete);
      }
    };

    requestAnimationFrame(frame);
  }

  private buildWordRows(
    items: ElementRenderItem[],
    tileSize: number,
    tileGap: number,
    wordGap: number,
    maxWidth: number
  ): ElementRenderItem[][][] {
    const words: ElementRenderItem[][] = [];
    let cur: ElementRenderItem[] = [];
    for (const item of items) {
      if (item.type === 'space') {
        if (cur.length > 0) { words.push(cur); cur = []; }
      } else { cur.push(item); }
    }
    if (cur.length > 0) words.push(cur);

    const wpx = (w: ElementRenderItem[]) => w.length * tileSize + Math.max(0, w.length - 1) * tileGap;

    const rows: ElementRenderItem[][][] = [];
    let row: ElementRenderItem[][] = [];
    let rw = 0;
    for (const word of words) {
      const ww = wpx(word);
      const added = (row.length > 0 ? wordGap : 0) + ww;
      if (rw + added > maxWidth && row.length > 0) {
        rows.push(row); row = [word]; rw = ww;
      } else {
        row.push(word); rw += added;
      }
    }
    if (row.length > 0) rows.push(row);
    return rows;
  }

  private drawAnimatedTile(
    ctx: CanvasRenderingContext2D,
    item: ElementRenderItem,
    x: number, y: number, size: number,
    anim: TileAnim
  ): void {
    if (anim.opacity <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = anim.opacity;
    ctx.translate(x + size / 2, y + size / 2 + anim.dy * (size / 64));
    ctx.scale(anim.scale, anim.scale);
    this.drawTile(ctx, item, -size / 2, -size / 2, size);
    ctx.restore();
  }

  private drawTile(ctx: CanvasRenderingContext2D, item: ElementRenderItem, x: number, y: number, size: number): void {
    const isFake = !!item.fakeElement;
    const el = item.element || item.fakeElement;
    if (!el) return;

    const bgColor = isFake ? getFakeElementColor() : getCategoryColor((el as Element).category);
    const borderColor = isFake ? getFakeElementBorderColor() : getCategoryBorderColor((el as Element).category);
    const radius = size * 0.1;
    const borderWidth = Math.max(2, size * 0.03);

    this.roundRectPath(ctx, x, y, size, size, radius);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.setLineDash([]);
    ctx.stroke();

    if (!isFake && (el as Element).atomicNumber) {
      ctx.font = `700 ${size * 0.14}px "Nunito", Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.fillText(String((el as Element).atomicNumber), x + size * 0.07, y + size * 0.05);
    }

    ctx.font = `900 ${size * 0.38}px "Nunito", "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.5;
    ctx.strokeText(el.symbol, x + size / 2, y + size * 0.52);
    ctx.fillStyle = isFake ? '#78350f' : 'white';
    ctx.fillText(el.symbol, x + size / 2, y + size * 0.52);

    ctx.font = `600 ${size * 0.12}px "Nunito", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = isFake ? 'rgba(120,53,15,0.85)' : 'rgba(255,255,255,0.88)';
    const maxNameW = size * 0.88;
    let name = el.name;
    while (ctx.measureText(name).width > maxNameW && name.length > 1) name = name.slice(0, -1);
    if (name.length < el.name.length) name = name.slice(0, -1) + '…';
    ctx.fillText(name, x + size / 2, y + size * 0.94);
  }

  private drawColorfulTitle(ctx: CanvasRenderingContext2D, text: string, centerX: number, baselineY: number, fontSize: number): void {
    ctx.font = `900 ${fontSize}px "Nunito", "Arial Black", sans-serif`;
    ctx.textBaseline = 'alphabetic';
    const chars = text.split('').map(ch => ({ ch, w: ctx.measureText(ch).width, isSpace: ch === ' ' }));
    const totalWidth = chars.reduce((s, c) => s + c.w, 0);
    let x = centerX - totalWidth / 2;
    let ci = 0;
    for (const { ch, w, isSpace } of chars) {
      if (!isSpace) {
        const color = TITLE_COLORS[ci++ % TITLE_COLORS.length];
        ctx.lineWidth = fontSize * 0.065;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#111111';
        ctx.textAlign = 'left';
        ctx.strokeText(ch, x, baselineY);
        ctx.fillStyle = color;
        ctx.fillText(ch, x, baselineY);
      }
      x += w;
    }
  }

  private roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
