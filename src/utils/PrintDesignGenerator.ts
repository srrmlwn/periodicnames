import type { NameResult } from '../types';
import { createElementLayout } from './elementRenderer';
import type { ElementLayout, ElementRenderItem } from './elementRenderer';
import { BRAND } from './colorSchemes';
import { canvasFont, drawElementTile, drawTableBackground, ensureCanvasFonts } from './canvasTile';


export class PrintDesignGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generatePrintDesign(
    result: NameResult,
    customText?: string,
    tilesOffset?: { x: number; y: number },
    captionOffset?: { x: number; y: number },
    showWatermark = true,
  ): Promise<Blob> {
    await ensureCanvasFonts();

    const size = 4500;
    this.canvas.width = size;
    this.canvas.height = size;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, size, size);

    if (showWatermark) drawTableBackground(this.ctx, size, size);

    const padding = 300;
    const hasCaption = !!(customText?.trim());
    const captionFontHeight = 200;
    const captionGap = 120;
    const availableWidth = size - padding * 2;
    const tileAvailableHeight = size - padding * 2;

    const elementLayout = createElementLayout(result);
    const { tileSize, rows, tileGap, wordGap, rowGap } =
      this.computePrintLayout(elementLayout, availableWidth, tileAvailableHeight);

    const totalTilesHeight = rows.length * tileSize + Math.max(0, rows.length - 1) * rowGap;

    // Tiles centered vertically + free offset
    const tilesStartY = size / 2 - totalTilesHeight / 2 + (tilesOffset?.y ?? 0);
    const tilesXShift = tilesOffset?.x ?? 0;

    // Widest row — needed for brand text placement
    const maxRowWidth = rows.reduce((m, row) => {
      let rw = 0;
      row.forEach((word, wi) => {
        if (wi > 0) rw += wordGap;
        rw += word.length * tileSize + Math.max(0, word.length - 1) * tileGap;
      });
      return Math.max(m, rw);
    }, 0);
    const tilesRightEdge = (size + maxRowWidth) / 2 + tilesXShift;
    const tilesBottomEdge = tilesStartY + totalTilesHeight;

    // Caption defaults ABOVE tile group + free offset
    const captionY = tilesStartY - captionGap - captionFontHeight + (captionOffset?.y ?? 0);
    const captionX = size / 2 + (captionOffset?.x ?? 0);

    if (hasCaption && customText) {
      ctx.font = canvasFont(600, captionFontHeight);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 12;
      ctx.lineJoin = 'round';
      ctx.strokeText(customText, captionX, captionY, availableWidth);
      ctx.fillStyle = BRAND.paper;
      ctx.fillText(customText, captionX, captionY, availableWidth);
    }

    this.drawWordRows(rows, tileSize, tileGap, wordGap, rowGap, tilesStartY, size, tilesXShift);

    // Brand text — bottom-right of tile group, moves with tiles
    ctx.font = canvasFont(400, 90);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(150,150,150,0.45)';
    ctx.fillText('periodicnames.com', tilesRightEdge, tilesBottomEdge + 60);

    return new Promise(resolve => {
      this.canvas.toBlob(blob => resolve(blob!), 'image/png', 0.95);
    });
  }

  private computePrintLayout(
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

    for (let tileSize = 700; tileSize >= 240; tileSize -= 10) {
      const tileGap = Math.round(tileSize * 0.09);
      const wordGap = Math.round(tileSize * 0.20);
      const rowGap = Math.round(tileSize * 0.12);

      if (maxWordLen * tileSize + (maxWordLen - 1) * tileGap > availableWidth) continue;

      const rows = this.buildWordRows(layout, tileSize, tileGap, wordGap, availableWidth);
      const totalHeight = rows.length * tileSize + Math.max(0, rows.length - 1) * rowGap;
      if (totalHeight <= availableHeight) return { tileSize, rows, tileGap, wordGap, rowGap };
    }

    const tileSize = 240;
    return {
      tileSize,
      rows: this.buildWordRows(layout, tileSize, 22, 48, availableWidth),
      tileGap: 22, wordGap: 48, rowGap: 29,
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
    canvasWidth: number,
    xShift = 0,
  ): void {
    rows.forEach((row, ri) => {
      let rowWidth = 0;
      row.forEach((word, wi) => {
        if (wi > 0) rowWidth += wordGap;
        rowWidth += word.length * tileSize + Math.max(0, word.length - 1) * tileGap;
      });
      let x = (canvasWidth - rowWidth) / 2 + xShift;
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
