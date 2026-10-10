import type { NameResult } from '../types';
import type { ImagePlatform } from '../types/sharing';
import { getDimensions } from '../templates/imageTemplates';
import { createElementLayout } from './elementRenderer';
import type { ElementLayout, ElementRenderItem } from './elementRenderer';
import { BRAND } from './colorSchemes';
import { canvasFont, drawElementTile, drawTableBackground, ensureCanvasFonts } from './canvasTile';


export class ShareImageGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generateXImage(result: NameResult, caption?: string, showWatermark = true): Promise<Blob> {
    const { width, height } = getDimensions('x');
    this.canvas.width = width;
    this.canvas.height = height;
    return this.render(result, 'x', caption, showWatermark);
  }

  async generateInstagramImage(result: NameResult, caption?: string, showWatermark = true): Promise<Blob> {
    const { width, height } = getDimensions('instagram');
    this.canvas.width = width;
    this.canvas.height = height;
    return this.render(result, 'instagram', caption, showWatermark);
  }

  async generateStoryImage(result: NameResult, caption?: string, showWatermark = true): Promise<Blob> {
    const { width, height } = getDimensions('story');
    this.canvas.width = width;
    this.canvas.height = height;
    return this.render(result, 'story', caption, showWatermark);
  }

  private async render(result: NameResult, platform: ImagePlatform, caption?: string, showWatermark = true): Promise<Blob> {
    await ensureCanvasFonts();

    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const isX = platform === 'x';

    ctx.fillStyle = BRAND.cream;
    ctx.fillRect(0, 0, width, height);

    if (showWatermark) drawTableBackground(this.ctx, width, height);

    const padding = isX ? 60 : 80;
    const titleSize = isX ? 42 : 54;
    const titleY = padding + titleSize;

    ctx.font = canvasFont(700, titleSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = BRAND.ink;
    ctx.fillText('Periodic Names', width / 2, titleY);

    const urlSize = isX ? 22 : 28;
    const urlBaselineY = height - (isX ? 36 : 48);
    const contentTop = titleY + titleSize * 0.3 + 20;
    const captionSize = isX ? 26 : 34;
    const captionReserve = caption ? captionSize + 16 : 0;
    const contentBottom = urlBaselineY - urlSize - 16 - captionReserve;

    const layout = createElementLayout(result);
    const { tileSize, rows, tileGap, wordGap, rowGap } =
      this.computeOptimalLayout(layout, width - padding * 2, contentBottom - contentTop);

    const totalTilesHeight = rows.length * tileSize + Math.max(0, rows.length - 1) * rowGap;
    const tilesStartY = contentTop + Math.max(0, (contentBottom - contentTop - totalTilesHeight) / 2);

    this.drawWordRows(rows, tileSize, tileGap, wordGap, rowGap, tilesStartY, width);

    if (caption) {
      const captionBaselineY = contentBottom + captionReserve / 2 + captionSize / 2;
      ctx.font = canvasFont(600, captionSize);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = BRAND.ink;
      let cap = caption;
      const maxW = width - padding * 2;
      while (ctx.measureText(cap).width > maxW && cap.length > 1) cap = cap.slice(0, -1);
      if (cap.length < caption.length) cap = cap.slice(0, -1) + '…';
      ctx.fillText(cap, width / 2, captionBaselineY);
    }

    ctx.font = canvasFont(600, urlSize);
    ctx.fillStyle = BRAND.muted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`periodicnames.com/${result.originalName.toLowerCase().replace(/\s+/g, '-')}`, width / 2, urlBaselineY);

    return new Promise(resolve => {
      this.canvas.toBlob(blob => resolve(blob!), 'image/png', 0.95);
    });
  }

  private computeOptimalLayout(
    layout: ElementLayout,
    availableWidth: number,
    availableHeight: number
  ): { tileSize: number; rows: ElementRenderItem[][][]; tileGap: number; wordGap: number; rowGap: number } {
    const words: ElementRenderItem[][] = [];
    let cur: ElementRenderItem[] = [];
    for (const item of layout.items) {
      if (item.type === 'space') {
        if (cur.length > 0) { words.push(cur); cur = []; }
      } else { cur.push(item); }
    }
    if (cur.length > 0) words.push(cur);
    const maxWordLen = Math.max(1, ...words.map(w => w.length));

    for (let tileSize = 160; tileSize >= 48; tileSize -= 4) {
      const tileGap = Math.round(tileSize * 0.09);
      const wordGap = Math.round(tileSize * 0.20);
      const rowGap = Math.round(tileSize * 0.14);

      if (maxWordLen * tileSize + (maxWordLen - 1) * tileGap > availableWidth) continue;

      const rows = this.buildWordRows(layout, tileSize, tileGap, wordGap, availableWidth);
      const totalHeight = rows.length * tileSize + Math.max(0, rows.length - 1) * rowGap;
      if (totalHeight <= availableHeight) return { tileSize, rows, tileGap, wordGap, rowGap };
    }

    const tileSize = 48;
    return {
      tileSize,
      rows: this.buildWordRows(layout, tileSize, 4, 10, availableWidth),
      tileGap: 4, wordGap: 10, rowGap: 6,
    };
  }

  private buildWordRows(
    layout: ElementLayout,
    tileSize: number,
    tileGap: number,
    wordGap: number,
    maxWidth: number
  ): ElementRenderItem[][][] {
    const words: ElementRenderItem[][] = [];
    let cur: ElementRenderItem[] = [];
    for (const item of layout.items) {
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

  private drawWordRows(
    rows: ElementRenderItem[][][],
    tileSize: number,
    tileGap: number,
    wordGap: number,
    rowGap: number,
    startY: number,
    canvasWidth: number
  ): void {
    rows.forEach((row, ri) => {
      let rowWidth = 0;
      row.forEach((word, wi) => {
        if (wi > 0) rowWidth += wordGap;
        rowWidth += word.length * tileSize + Math.max(0, word.length - 1) * tileGap;
      });
      let x = (canvasWidth - rowWidth) / 2;
      const y = startY + ri * (tileSize + rowGap);
      row.forEach((word, wi) => {
        if (wi > 0) x += wordGap;
        word.forEach((item, ti) => {
          if (ti > 0) x += tileGap;
          drawElementTile(this.ctx, item, x, y, tileSize);
          x += tileSize;
        });
      });
    });
  }
}
