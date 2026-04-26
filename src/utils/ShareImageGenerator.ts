import type { NameResult } from '../types';
import type { SharePlatform } from '../types/sharing';
import type { Element } from '../data/elements';
import { getDimensions } from '../templates/imageTemplates';
import { createElementLayout } from './elementRenderer';
import type { ElementLayout, ElementRenderItem } from './elementRenderer';
import { getCategoryColor, getCategoryBorderColor, getFakeElementColor, getFakeElementBorderColor } from './colorSchemes';

const TITLE_COLORS = ['#e03030', '#f97316', '#2563eb', '#059669', '#7c3aed', '#0284c7', '#db2777'];

export class ShareImageGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generateXImage(result: NameResult): Promise<Blob> {
    const { width, height } = getDimensions('x');
    this.canvas.width = width;
    this.canvas.height = height;
    return this.render(result, 'x');
  }

  async generateInstagramImage(result: NameResult): Promise<Blob> {
    const { width, height } = getDimensions('instagram');
    this.canvas.width = width;
    this.canvas.height = height;
    return this.render(result, 'instagram');
  }

  async generateStoryImage(result: NameResult): Promise<Blob> {
    const { width, height } = getDimensions('story');
    this.canvas.width = width;
    this.canvas.height = height;
    return this.render(result, 'story');
  }

  private async render(result: NameResult, platform: SharePlatform): Promise<Blob> {
    await document.fonts.ready;

    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    const isX = platform === 'x';
    const padding = isX ? 60 : 80;
    const usableWidth = width - padding * 2;

    const titleSize = isX ? 54 : 68;
    const titleBaselineY = padding + titleSize;
    this.drawColorfulTitle('Periodic Names', width / 2, titleBaselineY, titleSize);

    const subtitleSize = isX ? 26 : 34;
    const subtitleY = titleBaselineY + titleSize * 0.15 + subtitleSize + 16;
    ctx.font = `700 ${subtitleSize}px "Nunito", Arial, sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(result.originalName, width / 2, subtitleY);

    const tileSize = isX ? 88 : 110;
    const tileGap = isX ? 8 : 10;
    const wordGap = isX ? 18 : 24;
    const rowGap = isX ? 10 : 12;

    const layout = createElementLayout(result);
    const rows = this.buildWordRows(layout, tileSize, tileGap, wordGap, usableWidth);
    const totalTilesHeight = rows.length * tileSize + Math.max(0, rows.length - 1) * rowGap;

    const topUsed = subtitleY + subtitleSize * 0.3 + 36;
    const bottomReserved = 60;
    const remaining = height - topUsed - bottomReserved;
    const tilesStartY = topUsed + Math.max(0, (remaining - totalTilesHeight) / 2);

    this.drawWordRows(rows, tileSize, tileGap, wordGap, rowGap, tilesStartY, width);

    const brandSize = isX ? 18 : 22;
    ctx.font = `600 ${brandSize}px "Nunito", Arial, sans-serif`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('periodicnames.com', width / 2, height - 28);

    return new Promise(resolve => {
      this.canvas.toBlob(blob => resolve(blob!), 'image/png', 0.95);
    });
  }

  private drawColorfulTitle(text: string, centerX: number, baselineY: number, fontSize: number): void {
    const ctx = this.ctx;
    ctx.font = `900 ${fontSize}px "Nunito", "Arial Black", sans-serif`;
    ctx.textBaseline = 'alphabetic';

    const chars = text.split('').map(ch => ({ ch, w: ctx.measureText(ch).width, isSpace: ch === ' ' }));
    const totalWidth = chars.reduce((sum, c) => sum + c.w, 0);
    let x = centerX - totalWidth / 2;
    let colorIndex = 0;

    for (const { ch, w, isSpace } of chars) {
      if (!isSpace) {
        const color = TITLE_COLORS[colorIndex % TITLE_COLORS.length];
        colorIndex++;
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

  private buildWordRows(
    layout: ElementLayout,
    tileSize: number,
    tileGap: number,
    wordGap: number,
    maxWidth: number
  ): ElementRenderItem[][][] {
    const words: ElementRenderItem[][] = [];
    let current: ElementRenderItem[] = [];
    for (const item of layout.items) {
      if (item.type === 'space') {
        if (current.length > 0) { words.push(current); current = []; }
      } else {
        current.push(item);
      }
    }
    if (current.length > 0) words.push(current);

    const wordPx = (w: ElementRenderItem[]) =>
      w.length * tileSize + Math.max(0, w.length - 1) * tileGap;

    const rows: ElementRenderItem[][][] = [];
    let row: ElementRenderItem[][] = [];
    let rowWidth = 0;

    for (const word of words) {
      const ww = wordPx(word);
      const added = (row.length > 0 ? wordGap : 0) + ww;
      if (rowWidth + added > maxWidth && row.length > 0) {
        rows.push(row);
        row = [word];
        rowWidth = ww;
      } else {
        row.push(word);
        rowWidth += added;
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
          this.drawTile(item, x, y, tileSize);
          x += tileSize;
        });
      });
    });
  }

  private drawTile(item: ElementRenderItem, x: number, y: number, size: number): void {
    const ctx = this.ctx;
    const isFake = !!item.fakeElement;
    const el = item.element || item.fakeElement;
    if (!el) return;

    const bgColor = isFake ? getFakeElementColor() : getCategoryColor((el as Element).category);
    const borderColor = isFake ? getFakeElementBorderColor() : getCategoryBorderColor((el as Element).category);
    const radius = size * 0.1;
    const borderWidth = Math.max(2, size * 0.03);

    this.roundRectPath(x, y, size, size, radius);
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

  private roundRectPath(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
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
