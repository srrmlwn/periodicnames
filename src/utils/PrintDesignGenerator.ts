import type { NameResult } from '../types';
import type { Element } from '../data/elements';
import { getAllElements } from '../data/elements';
import { createElementLayout } from './elementRenderer';
import type { ElementLayout, ElementRenderItem } from './elementRenderer';
import { getCategoryColor, getFakeElementColor, getFakeElementBorderColor } from './colorSchemes';

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

export class PrintDesignGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generatePrintDesign(result: NameResult, customText?: string): Promise<Blob> {
    await document.fonts.ready;

    const size = 4500;
    this.canvas.width = size;
    this.canvas.height = size;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, size, size);

    this.drawPeriodicTableBackground(size, size);

    const padding = 300;
    const textReserved = customText ? 380 : 0;
    const availableWidth = size - padding * 2;
    const availableHeight = size - padding * 2 - textReserved;

    const layout = createElementLayout(result);
    const { tileSize, rows, tileGap, wordGap, rowGap } =
      this.computePrintLayout(layout, availableWidth, availableHeight);

    const totalTilesHeight = rows.length * tileSize + Math.max(0, rows.length - 1) * rowGap;
    const tilesStartY = padding + Math.max(0, (availableHeight - totalTilesHeight) / 2);

    this.drawWordRows(rows, tileSize, tileGap, wordGap, rowGap, tilesStartY, size);

    if (customText) {
      const textY = tilesStartY + totalTilesHeight + 140;
      ctx.font = `600 200px "Nunito", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 12;
      ctx.lineJoin = 'round';
      ctx.strokeText(customText, size / 2, textY, availableWidth);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(customText, size / 2, textY, availableWidth);
    }

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
    const borderColor = isFake ? getFakeElementBorderColor() : '#111111';
    const radius = size * 0.1;
    const borderWidth = Math.max(4, size * 0.03);

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
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 1.5;
    ctx.strokeText(el.symbol, x + size / 2, y + size * 0.52);
    ctx.fillStyle = isFake ? '#fde68a' : 'white';
    ctx.fillText(el.symbol, x + size / 2, y + size * 0.52);

    if (isFake) {
      ctx.font = `900 ${size * 0.14}px "Nunito", "Arial Black", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#fcd34d';
      ctx.fillText('*', x + size * 0.62, y + size * 0.06);
    }

    ctx.font = `600 ${size * 0.12}px "Nunito", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = isFake ? 'rgba(253,230,138,0.85)' : 'rgba(255,255,255,0.88)';
    const maxNameW = size * 0.88;
    let name = el.name;
    while (ctx.measureText(name).width > maxNameW && name.length > 1) name = name.slice(0, -1);
    if (name.length < el.name.length) name = name.slice(0, -1) + '…';
    ctx.fillText(name, x + size / 2, y + size * 0.94);
  }

  private drawPeriodicTableBackground(width: number, height: number): void {
    const ctx = this.ctx;
    const categoryMap = new Map(getAllElements().map(e => [e.symbol, e.category]));

    const cellSize = width / 18;
    const tableHeight = 9.5 * cellSize;
    const tableStartY = (height - tableHeight) / 2;
    const pad = cellSize * 0.05;

    ctx.globalAlpha = 0.09;
    for (const [symbol, row, col] of ELEMENT_POSITIONS) {
      const category = categoryMap.get(symbol);
      if (!category) continue;
      const x = col * cellSize;
      const y = tableStartY + (row <= 6 ? row : row + 0.5) * cellSize;
      this.roundRectPath(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, cellSize * 0.1);
      ctx.fillStyle = getCategoryColor(category);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
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
