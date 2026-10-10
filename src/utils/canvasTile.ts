import type { Element } from '../data/elements';
import { getAllElements } from '../data/elements';
import type { ElementRenderItem } from './elementRenderer';
import { BRAND, FONT_FAMILY, getCategoryColor, getFakeElementColor, getFakeElementBorderColor } from './colorSchemes';

// [symbol, row (0-8), col (0-17)]; rows 7-8 are lanthanides/actinides with a half-cell gap below row 6
export const ELEMENT_POSITIONS: [string, number, number][] = [
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
  ['Gd', 7, 9], ['Tb', 7, 10], ['Dy', 7, 11], ['Ho', 7, 12], ['Er', 7, 13], ['Tm', 7, 14], ['Yb', 7, 15],
  ['Lu', 7, 16],
  ['Ac', 8, 2], ['Th', 8, 3], ['Pa', 8, 4], ['U', 8, 5], ['Np', 8, 6], ['Pu', 8, 7], ['Am', 8, 8],
  ['Cm', 8, 9], ['Bk', 8, 10], ['Cf', 8, 11], ['Es', 8, 12], ['Fm', 8, 13], ['Md', 8, 14], ['No', 8, 15],
  ['Lr', 8, 16],
];

export function canvasFont(weight: number, px: number): string {
  return `${weight} ${px}px ${FONT_FAMILY}`;
}

export function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (ctx.measureText(t + '…').width > maxWidth && t.length > 1) t = t.slice(0, -1);
  return t + '…';
}

export function fakeAtomicNumber(name: string): number {
  return [...name].reduce((sum, c) => sum + c.charCodeAt(0), 0);
}

export function drawElementTile(ctx: CanvasRenderingContext2D, item: ElementRenderItem, x: number, y: number, size: number): void {
  const isFake = !!item.fakeElement;
  const el = item.element || item.fakeElement;
  if (!el) return;

  const fill = isFake ? getFakeElementColor() : getCategoryColor((el as Element).category);
  const stroke = isFake ? getFakeElementBorderColor() : BRAND.ink;
  const textColor = isFake ? BRAND.yellow : BRAND.ink;
  const radius = size * 0.08;
  const borderWidth = Math.max(2, size * 0.045);
  const shadow = size * 0.07;

  roundRectPath(ctx, x + shadow, y + shadow, size, size, radius);
  ctx.fillStyle = BRAND.ink;
  ctx.fill();

  roundRectPath(ctx, x, y, size, size, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = borderWidth;
  ctx.setLineDash([]);
  ctx.stroke();

  const number = isFake ? fakeAtomicNumber(el.name) : (el as Element).atomicNumber;
  ctx.font = canvasFont(700, size * 0.14);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = textColor;
  ctx.globalAlpha *= 0.75;
  ctx.fillText(String(number), x + size * 0.09, y + size * 0.08);
  ctx.globalAlpha /= 0.75;

  ctx.font = canvasFont(700, size * 0.42);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  const symbolW = ctx.measureText(el.symbol).width;
  ctx.fillText(el.symbol, x + size / 2, y + size * 0.5);

  if (isFake) {
    ctx.font = canvasFont(700, size * 0.18);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('*', x + size / 2 + symbolW / 2 + size * 0.01, y + size * 0.24);
  }

  ctx.font = canvasFont(500, size * 0.12);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = textColor;
  ctx.fillText(fitText(ctx, el.name, size * 0.86), x + size / 2, y + size * 0.93);
}

export function drawTableBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const categoryMap = new Map(getAllElements().map(e => [e.symbol, e.category]));
  const cellSize = width / 18;
  const tableHeight = 9.5 * cellSize;
  const tableStartY = (height - tableHeight) / 2;
  const pad = cellSize * 0.07;

  ctx.save();
  ctx.lineWidth = Math.max(1, cellSize * 0.03);
  for (const [symbol, row, col] of ELEMENT_POSITIONS) {
    const category = categoryMap.get(symbol);
    if (!category) continue;
    const x = col * cellSize;
    const y = tableStartY + (row <= 6 ? row : row + 0.5) * cellSize;
    roundRectPath(ctx, x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, cellSize * 0.08);
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = getCategoryColor(category);
    ctx.fill();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = BRAND.ink;
    ctx.stroke();
  }
  ctx.restore();
}

export async function ensureCanvasFonts(): Promise<void> {
  await Promise.all([500, 600, 700].map(w => document.fonts.load(canvasFont(w, 40))));
  await document.fonts.ready;
}
