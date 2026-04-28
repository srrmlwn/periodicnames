import type { NameResult } from '../types';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';
import { getDimensions } from '../templates/imageTemplates';
import { createElementLayout } from './elementRenderer';
import type { ElementLayout, ElementRenderItem } from './elementRenderer';
import { getCategoryColor, getCategoryBorderColor, getFakeElementColor, getFakeElementBorderColor } from './colorSchemes';
import { matchNameToElements } from './elementMatcher';

// [symbol, row (0-8), col (0-17)]
// Rows 7-8 are lanthanides/actinides, rendered with a gap below row 6
const ELEMENT_POSITIONS: [string, number, number][] = [
  ['H', 0, 0], ['He', 0, 17],
  ['Li', 1, 0], ['Be', 1, 1], ['B', 1, 12], ['C', 1, 13], ['N', 1, 14], ['O', 1, 15], ['F', 1, 16], ['Ne', 1, 17],
  ['Na', 2, 0], ['Mg', 2, 1], ['Al', 2, 12], ['Si', 2, 13], ['P', 2, 14], ['S', 2, 15], ['Cl', 2, 16], ['Ar', 2, 17],
  ['K', 3, 0], ['Ca', 3, 1], ['Sc', 3, 2], ['Ti', 3, 3], ['V', 3, 4], ['Cr', 3, 5], ['Mn', 3, 6],
  ['Fe', 3, 7], ['Co', 3, 8], ['Ni', 3, 9], ['Cu', 3, 10], ['Zn', 3, 11], ['Ga', 3, 12], ['Ge', 3, 13],
  ['As', 3, 14], ['Se', 3, 15], ['Br', 3, 16], ['Kr', 3, 17],
  ['Rb', 4, 0], ['Sr', 4, 1], ['Y', 4, 2], ['Zr', 4, 3], ['Nb', 4, 4], ['Mo', 4, 5], ['Tc', 4, 6],
  ['Ru', 4, 7], ['Rh', 4, 8], ['Pd', 4, 9], ['Ag', 4, 10], ['Cd', 4, 11], ['In', 4, 12], ['Sn', 4, 13],
  ['Sb', 4, 14], ['Te', 4, 15], ['I', 4, 16], ['Xe', 4, 17],
  ['Cs', 5, 0], ['Ba', 5, 1], ['Hf', 5, 3], ['Ta', 5, 4], ['W', 5, 5], ['Re', 5, 6], ['Os', 5, 7],
  ['Ir', 5, 8], ['Pt', 5, 9], ['Au', 5, 10], ['Hg', 5, 11], ['Tl', 5, 12], ['Pb', 5, 13], ['Bi', 5, 14],
  ['Po', 5, 15], ['At', 5, 16], ['Rn', 5, 17],
  ['Fr', 6, 0], ['Ra', 6, 1], ['Rf', 6, 3], ['Db', 6, 4], ['Sg', 6, 5], ['Bh', 6, 6], ['Hs', 6, 7],
  ['Mt', 6, 8], ['Ds', 6, 9], ['Rg', 6, 10], ['Cn', 6, 11], ['Nh', 6, 12], ['Fl', 6, 13], ['Mc', 6, 14],
  ['Lv', 6, 15], ['Ts', 6, 16], ['Og', 6, 17],
  ['La', 7, 2], ['Ce', 7, 3], ['Pr', 7, 4], ['Nd', 7, 5], ['Pm', 7, 6], ['Sm', 7, 7], ['Eu', 7, 8],
  ['Gd', 7, 9], ['Tb', 7, 10], ['Dy', 7, 11], ['Ho', 7, 12], ['Er', 7, 13], ['Tm', 7, 14], ['Yb', 7, 15], ['Lu', 7, 16],
  ['Ac', 8, 2], ['Th', 8, 3], ['Pa', 8, 4], ['U', 8, 5], ['Np', 8, 6], ['Pu', 8, 7], ['Am', 8, 8],
  ['Cm', 8, 9], ['Bk', 8, 10], ['Cf', 8, 11], ['Es', 8, 12], ['Fm', 8, 13], ['Md', 8, 14], ['No', 8, 15], ['Lr', 8, 16],
];

type TitleElement = Element | FakeElement;

const TITLE_WORDS: TitleElement[][] = (() => {
  const result = matchNameToElements('Periodic Names');
  const words: TitleElement[][] = [];
  let current: TitleElement[] = [];
  for (const el of result.orderedElements) {
    if (el.symbol === ' ') {
      if (current.length > 0) { words.push(current); current = []; }
    } else {
      current.push(el as TitleElement);
    }
  }
  if (current.length > 0) words.push(current);
  return words;
})();

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

  private async render(result: NameResult, platform: string): Promise<Blob> {
    await document.fonts.ready;

    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const isX = platform === 'x';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    this.drawPeriodicTableBackground(width, height);

    const padding = isX ? 60 : 80;

    const titleTileSize = this.drawGhostTitleTiles(padding, width - padding * 2);

    const urlSize = isX ? 24 : 30;
    const urlBaselineY = height - (isX ? 38 : 50);

    const contentTop = padding + titleTileSize + 24;
    const contentBottom = urlBaselineY - urlSize - 16;

    const layout = createElementLayout(result);
    const { tileSize, rows, tileGap, wordGap, rowGap } =
      this.computeOptimalLayout(layout, width - padding * 2, contentBottom - contentTop);

    const totalTilesHeight = rows.length * tileSize + Math.max(0, rows.length - 1) * rowGap;
    const tilesStartY = contentTop + Math.max(0, (contentBottom - contentTop - totalTilesHeight) / 2);

    this.drawWordRows(rows, tileSize, tileGap, wordGap, rowGap, tilesStartY, width);

    const slug = result.originalName.toLowerCase().replace(/\s+/g, '-');
    ctx.font = `700 ${urlSize}px "Nunito", Arial, sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`periodicnames.com/${slug}`, width / 2, urlBaselineY);

    return new Promise(resolve => {
      this.canvas.toBlob(blob => resolve(blob!), 'image/png', 0.95);
    });
  }

  private drawPeriodicTableBackground(width: number, height: number): void {
    const ctx = this.ctx;

    const cellSize = width / 18;
    const tableHeight = 9.5 * cellSize;
    const tableStartY = (height - tableHeight) / 2;
    const pad = cellSize * 0.06;

    for (const [symbol, row, col] of ELEMENT_POSITIONS) {
      const x = col * cellSize;
      const y = tableStartY + (row <= 6 ? row : row + 0.5) * cellSize;
      const rSize = cellSize - pad * 2;

      this.roundRectPath(x + pad, y + pad, rSize, rSize, rSize * 0.1);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.lineWidth = Math.max(1, cellSize * 0.03);
      ctx.setLineDash([]);
      ctx.stroke();

      ctx.font = `700 ${cellSize * 0.32}px "Nunito", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.fillText(symbol, x + cellSize / 2, y + cellSize * 0.55);
    }
  }

  private drawGhostTitleTiles(topY: number, maxWidth: number): number {
    const ctx = this.ctx;
    const words = TITLE_WORDS;

    const totalTiles = words.reduce((s, w) => s + w.length, 0);
    const intraGaps = words.reduce((s, w) => s + Math.max(0, w.length - 1), 0);
    const wordGapCount = words.length - 1;

    // tileGap = T * 0.1, wordGap = T * 0.25 — solve for T to fit on one line
    const widthFactor = totalTiles + intraGaps * 0.1 + wordGapCount * 0.25;
    const tileSize = Math.min(80, Math.floor(maxWidth / widthFactor));
    const tileGap = Math.round(tileSize * 0.1);
    const wordGap = Math.round(tileSize * 0.25);

    let totalWidth = 0;
    words.forEach((word, wi) => {
      if (wi > 0) totalWidth += wordGap;
      totalWidth += word.length * tileSize + Math.max(0, word.length - 1) * tileGap;
    });

    let x = (this.canvas.width - totalWidth) / 2;

    words.forEach((word, wi) => {
      if (wi > 0) x += wordGap;
      word.forEach((el, ti) => {
        if (ti > 0) x += tileGap;

        const radius = tileSize * 0.1;
        const borderWidth = Math.max(1, tileSize * 0.04);

        this.roundRectPath(x, topY, tileSize, tileSize, radius);
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
        ctx.lineWidth = borderWidth;
        ctx.setLineDash([]);
        ctx.stroke();

        if ('atomicNumber' in el) {
          ctx.font = `600 ${tileSize * 0.16}px "Nunito", Arial, sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
          ctx.fillText(String(el.atomicNumber), x + tileSize * 0.07, topY + tileSize * 0.05);
        }

        ctx.font = `900 ${tileSize * 0.38}px "Nunito", "Arial Black", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(100, 116, 139, 0.65)';
        ctx.fillText(el.symbol, x + tileSize / 2, topY + tileSize * 0.52);

        ctx.font = `600 ${tileSize * 0.12}px "Nunito", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
        let name = el.name;
        const maxNameW = tileSize * 0.88;
        while (ctx.measureText(name).width > maxNameW && name.length > 1) name = name.slice(0, -1);
        if (name.length < el.name.length) name = name.slice(0, -1) + '…';
        ctx.fillText(name, x + tileSize / 2, topY + tileSize * 0.94);

        x += tileSize;
      });
    });

    return tileSize;
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

    for (let tileSize = 140; tileSize >= 48; tileSize -= 4) {
      const tileGap = Math.round(tileSize * 0.09);
      const wordGap = Math.round(tileSize * 0.20);
      const rowGap = Math.round(tileSize * 0.12);

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
