import type { NameResult } from '../types';
import { createElementLayout } from './elementRenderer';
import type { ElementRenderItem } from './elementRenderer';
import { BRAND } from './colorSchemes';
import { canvasFont, drawElementTile, drawTableBackground, ensureCanvasFonts } from './canvasTile';

const STAGGER_MS = 500;
const POP_MS = 200;
const HOLD_MS = 2500;
const TILES_START_MS = 2000; // starts after name text finishes fading out
const TEXT_FADE_IN_END = 700;
const TEXT_HOLD_END = 1600;
const TEXT_FADE_OUT_END = 2000;
const CANVAS_W = 1080;
const CANVAS_H = 1920;
const FPS = 30;


interface TileAnim { scale: number; opacity: number; dy: number }

function animForProgress(t: number): TileAnim {
  if (t <= 0) return { scale: 1, opacity: 0, dy: 0 };
  if (t >= 1) return { scale: 1, opacity: 1, dy: 0 };
  return { scale: 1, opacity: t, dy: 0 };
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
    return TILES_START_MS + Math.max(numTiles - 1, 0) * STAGGER_MS + POP_MS + HOLD_MS;
  }

  async generateReelVideo(
    result: NameResult,
    onProgress?: (ratio: number) => void
  ): Promise<Blob> {
    await ensureCanvasFonts();

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

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
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
      };
      recorder.onerror = reject;
      recorder.start(100);
      this.runAnimation(canvas, result, totalDuration, onProgress, () => {
        recorder.stop();
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

    const padding = 80;
    const titleSize = 68;
    const titleY = padding + titleSize;
    const urlSize = 26;
    const urlBaselineY = CANVAS_H - 40;
    const contentTop = titleY + titleSize * 0.2 + 24;
    const contentBottom = urlBaselineY - urlSize - 16;
    const availableWidth = CANVAS_W - padding * 2;
    const availableHeight = contentBottom - contentTop;

    // Responsive tile layout: largest tiles that fit the available space
    const { tileSize, rows, tileGap, wordGap, rowGap } =
      this.computeOptimalLayout(layout, availableWidth, availableHeight);

    const totalRowsHeight = rows.length * tileSize + Math.max(0, rows.length - 1) * rowGap;
    const tilesStartY = contentTop + Math.max(0, (availableHeight - totalRowsHeight) / 2);

    // Size the text font to match the widest tile row so they look the same scale
    let maxTileRowWidth = 0;
    rows.forEach(row => {
      let w = 0;
      row.forEach((word, wi) => {
        if (wi > 0) w += wordGap;
        w += word.length * tileSize + Math.max(0, word.length - 1) * tileGap;
      });
      maxTileRowWidth = Math.max(maxTileRowWidth, w);
    });
    const REF = 300;
    ctx.font = canvasFont(700, REF);
    const refWidth = ctx.measureText(result.originalName).width;
    const nameFontSize = Math.min(Math.round(REF * maxTileRowWidth / refWidth), REF);

    // Pre-render the faded periodic table background once
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = CANVAS_W;
    bgCanvas.height = CANVAS_H;
    drawTableBackground(bgCanvas.getContext('2d')!, CANVAS_W, CANVAS_H);

    const tileStarts = new Map<ElementRenderItem, number>();
    let idx = 0;
    layout.items.forEach(item => {
      if (item.type !== 'space') tileStarts.set(item, TILES_START_MS + idx++ * STAGGER_MS);
    });

    const slug = result.originalName.toLowerCase().replace(/\s+/g, '-');
    const startEpoch = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startEpoch;

      ctx.fillStyle = BRAND.cream;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(bgCanvas, 0, 0);

      ctx.font = canvasFont(700, titleSize);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = BRAND.ink;
      ctx.fillText('Periodic Names', CANVAS_W / 2, titleY);

      // Text intro phase
      const nameOpacity = elapsed < TEXT_FADE_IN_END
        ? elapsed / TEXT_FADE_IN_END
        : elapsed < TEXT_HOLD_END
          ? 1
          : elapsed < TEXT_FADE_OUT_END
            ? 1 - (elapsed - TEXT_HOLD_END) / (TEXT_FADE_OUT_END - TEXT_HOLD_END)
            : 0;
      const nameScale = elapsed < TEXT_FADE_IN_END
        ? 0.85 + 0.15 * (elapsed / TEXT_FADE_IN_END)
        : elapsed < TEXT_HOLD_END
          ? 1
          : 1 - 0.08 * ((elapsed - TEXT_HOLD_END) / (TEXT_FADE_OUT_END - TEXT_HOLD_END));

      if (nameOpacity > 0.01) {
        this.drawNameText(ctx, result.originalName, nameFontSize, nameOpacity, nameScale,
          (contentTop + contentBottom) / 2);
      }

      rows.forEach((row, ri) => {
        let rowWidth = 0;
        row.forEach((word, wi) => {
          if (wi > 0) rowWidth += wordGap;
          rowWidth += word.length * tileSize + Math.max(0, word.length - 1) * tileGap;
        });
        let x = (CANVAS_W - rowWidth) / 2;
        const y = tilesStartY + ri * (tileSize + rowGap);
        row.forEach((word, wi) => {
          if (wi > 0) x += wordGap;
          word.forEach((item, ti) => {
            if (ti > 0) x += tileGap;
            const start = tileStarts.get(item) ?? 0;
            const progress = Math.min(1, Math.max(0, (elapsed - start) / POP_MS));
            this.drawAnimatedTile(ctx, item, x, y, tileSize, animForProgress(progress));
            x += tileSize;
          });
        });
      });

      ctx.font = canvasFont(600, urlSize);
      ctx.fillStyle = BRAND.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`periodicnames.com/${slug}`, CANVAS_W / 2, urlBaselineY);

      onProgress?.(Math.min(1, elapsed / totalDuration));

      // Run 200ms past totalDuration before stopping — gives the 30fps capture
      // stream enough cycles to record the final fully-revealed frame.
      if (elapsed < totalDuration + 200) {
        requestAnimationFrame(frame);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(frame);
  }

  private computeOptimalLayout(
    layout: { items: ElementRenderItem[] },
    availableWidth: number,
    availableHeight: number
  ): { tileSize: number; rows: ElementRenderItem[][][]; tileGap: number; wordGap: number; rowGap: number } {
    // Pre-group into words once (groupings are independent of tile size)
    const words: ElementRenderItem[][] = [];
    let cur: ElementRenderItem[] = [];
    for (const item of layout.items) {
      if (item.type === 'space') {
        if (cur.length > 0) { words.push(cur); cur = []; }
      } else { cur.push(item); }
    }
    if (cur.length > 0) words.push(cur);
    const maxWordLen = Math.max(1, ...words.map(w => w.length));

    for (let tileSize = 200; tileSize >= 60; tileSize -= 4) {
      const tileGap = Math.round(tileSize * 0.09);
      const wordGap = Math.round(tileSize * 0.20);
      const rowGap = Math.round(tileSize * 0.12);

      // Ensure the widest single word fits on one row
      if (maxWordLen * tileSize + (maxWordLen - 1) * tileGap > availableWidth) continue;

      const rows = this.buildWordRows(layout.items, tileSize, tileGap, wordGap, availableWidth);
      const totalHeight = rows.length * tileSize + Math.max(0, rows.length - 1) * rowGap;
      if (totalHeight <= availableHeight) return { tileSize, rows, tileGap, wordGap, rowGap };
    }

    const tileSize = 60;
    return { tileSize, rows: this.buildWordRows(layout.items, tileSize, 5, 12, availableWidth), tileGap: 5, wordGap: 12, rowGap: 7 };
  }

  private drawNameText(
    ctx: CanvasRenderingContext2D,
    name: string,
    fontSize: number,
    opacity: number,
    scale: number,
    centerY: number
  ): void {
    ctx.font = canvasFont(700, fontSize);
    const chars = name.split('').map(ch => ({ ch, w: ctx.measureText(ch).width }));
    const totalWidth = chars.reduce((s, c) => s + c.w, 0);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(CANVAS_W / 2, centerY);
    ctx.scale(scale, scale);

    ctx.fillStyle = BRAND.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    let x = -totalWidth / 2;
    for (const { ch, w } of chars) {
      if (ch !== ' ') ctx.fillText(ch, x, 0);
      x += w;
    }

    ctx.restore();
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
    drawElementTile(ctx, item, -size / 2, -size / 2, size);
    ctx.restore();
  }
}
