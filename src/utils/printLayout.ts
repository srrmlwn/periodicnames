import type { NameResult } from '../types';
import { createElementLayout } from './elementRenderer';
import type { ElementRenderItem } from './elementRenderer';
import { BRAND } from './colorSchemes';
import { canvasFont, drawElementTile } from './canvasTile';

export const PRINT_FRAME = { widthIn: 12, heightIn: 16, ppi: 150 } as const;

export const PRINT_AREA_BELOW_COLLAR_IN = 2.25;

export type Placement = 'chest' | 'big';

interface PlacementSpec {
  label: string;
  maxTileIn: number;
  maxWidthIn: number;
  maxHeightIn: number;
  belowCollarIn: number;
}

export const PLACEMENTS: Record<Placement, PlacementSpec> = {
  chest: { label: 'Chest', maxTileIn: 2.2, maxWidthIn: 10, maxHeightIn: 5.5, belowCollarIn: 3.25 },
  big: { label: 'Big', maxTileIn: 3.4, maxWidthIn: 12, maxHeightIn: 10, belowCollarIn: 3.5 },
};

export interface PrintPosition {
  area_width: number;
  area_height: number;
  width: number;
  height: number;
  top: number;
  left: number;
}

export interface PrintLayout {
  rows: ElementRenderItem[][][];
  tileIn: number;
  tileGapIn: number;
  wordGapIn: number;
  rowGapIn: number;
  widthIn: number;
  heightIn: number;
  tilesWidthIn: number;
  captionTopIn: number;
  captionSizeIn: number;
  brandTopIn: number;
  brandSizeIn: number;
  position: PrintPosition;
}

const MIN_TILE_IN = 0.6;
const TILE_STEP_IN = 0.05;
const SHADOW_RATIO = 0.07;
const BRAND_TEXT = 'periodicnames.com';

type MeasureText = (text: string, sizeIn: number, weight: number) => number;

function splitWords(items: ElementRenderItem[]): ElementRenderItem[][] {
  const words: ElementRenderItem[][] = [];
  let cur: ElementRenderItem[] = [];
  for (const item of items) {
    if (item.type === 'space') {
      if (cur.length > 0) { words.push(cur); cur = []; }
    } else {
      cur.push(item);
    }
  }
  if (cur.length > 0) words.push(cur);
  return words;
}

function wrapWords(words: ElementRenderItem[][], tile: number, gap: number, wordGap: number, maxWidth: number) {
  const wordWidth = (w: ElementRenderItem[]) => w.length * tile + Math.max(0, w.length - 1) * gap;
  const rows: ElementRenderItem[][][] = [];
  let row: ElementRenderItem[][] = [];
  let rowWidth = 0;
  for (const word of words) {
    const added = (row.length > 0 ? wordGap : 0) + wordWidth(word);
    if (row.length > 0 && rowWidth + added > maxWidth) {
      rows.push(row);
      row = [word];
      rowWidth = wordWidth(word);
    } else {
      row.push(word);
      rowWidth += added;
    }
  }
  if (row.length > 0) rows.push(row);
  const widest = rows.reduce((m, r) => Math.max(m, r.reduce((w, word, i) => w + (i > 0 ? wordGap : 0) + wordWidth(word), 0)), 0);
  return { rows, widest };
}

function rowWidthIn(row: ElementRenderItem[][], layout: Pick<PrintLayout, 'tileIn' | 'tileGapIn' | 'wordGapIn'>): number {
  return row.reduce((w, word, i) =>
    w + (i > 0 ? layout.wordGapIn : 0) + word.length * layout.tileIn + Math.max(0, word.length - 1) * layout.tileGapIn, 0);
}

export function computePrintLayout(
  result: NameResult,
  caption: string,
  placement: Placement,
  measureText: MeasureText,
): PrintLayout {
  const spec = PLACEMENTS[placement];
  const words = splitWords(createElementLayout(result).items);
  const maxWordLen = Math.max(1, ...words.map(w => w.length));
  const hasCaption = caption.trim().length > 0;

  let tile = spec.maxTileIn;
  for (; tile > MIN_TILE_IN; tile -= TILE_STEP_IN) {
    const gap = tile * 0.09;
    const usable = spec.maxWidthIn - tile * SHADOW_RATIO;
    if (maxWordLen * tile + (maxWordLen - 1) * gap > usable) continue;
    const { rows } = wrapWords(words, tile, gap, tile * 0.2, usable);
    const tilesH = rows.length * tile + Math.max(0, rows.length - 1) * tile * 0.12 + tile * SHADOW_RATIO;
    const extraH = (hasCaption ? tile * 0.45 : 0) + tile * 0.28;
    if (tilesH + extraH <= spec.maxHeightIn) break;
  }
  tile = Math.max(tile, MIN_TILE_IN);

  const tileGapIn = tile * 0.09;
  const wordGapIn = tile * 0.2;
  const rowGapIn = tile * 0.12;
  const shadowIn = tile * SHADOW_RATIO;
  const { rows, widest } = wrapWords(words, tile, tileGapIn, wordGapIn, spec.maxWidthIn - shadowIn);

  const tilesWidthIn = widest + shadowIn;
  const tilesHeightIn = rows.length * tile + Math.max(0, rows.length - 1) * rowGapIn + shadowIn;

  const captionSizeIn = Math.min(0.6, Math.max(0.28, tile * 0.3));
  const captionTopIn = tilesHeightIn + tile * 0.14;
  const captionWidthIn = hasCaption ? Math.min(spec.maxWidthIn, measureText(caption.trim(), captionSizeIn, 700)) : 0;

  const brandSizeIn = Math.max(0.12, tile * 0.08);
  const brandTopIn = (hasCaption ? captionTopIn + captionSizeIn * 1.25 : tilesHeightIn) + tile * 0.08;

  const widthIn = Math.max(tilesWidthIn, captionWidthIn);
  const heightIn = brandTopIn + brandSizeIn * 1.2;

  const ppi = PRINT_FRAME.ppi;
  const width = Math.round(widthIn * ppi);
  const height = Math.round(heightIn * ppi);
  const position: PrintPosition = {
    area_width: PRINT_FRAME.widthIn * ppi,
    area_height: PRINT_FRAME.heightIn * ppi,
    width,
    height,
    top: Math.round((spec.belowCollarIn - PRINT_AREA_BELOW_COLLAR_IN) * ppi),
    left: Math.round((PRINT_FRAME.widthIn * ppi - width) / 2),
  };

  return {
    rows, tileIn: tile, tileGapIn, wordGapIn, rowGapIn,
    widthIn, heightIn, tilesWidthIn,
    captionTopIn, captionSizeIn, brandTopIn, brandSizeIn,
    position,
  };
}

export function drawPrintDesign(
  ctx: CanvasRenderingContext2D,
  layout: PrintLayout,
  pxPerIn: number,
  caption: string,
  darkShirt: boolean,
): void {
  const s = pxPerIn;
  const centerX = (layout.widthIn * s) / 2;
  const shadow = layout.tileIn * SHADOW_RATIO * s;

  layout.rows.forEach((row, ri) => {
    let x = centerX - (rowWidthIn(row, layout) * s + shadow) / 2;
    const y = ri * (layout.tileIn + layout.rowGapIn) * s;
    row.forEach((word, wi) => {
      if (wi > 0) x += layout.wordGapIn * s;
      word.forEach((item, ti) => {
        if (ti > 0) x += layout.tileGapIn * s;
        drawElementTile(ctx, item, x, y, layout.tileIn * s);
        x += layout.tileIn * s;
      });
    });
  });

  const text = caption.trim();
  if (text) {
    ctx.font = canvasFont(700, layout.captionSizeIn * s);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = darkShirt ? BRAND.paper : BRAND.ink;
    ctx.fillText(text, centerX, layout.captionTopIn * s, layout.widthIn * s);
  }

  ctx.font = canvasFont(500, layout.brandSizeIn * s);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = darkShirt ? 'rgba(255,255,255,0.45)' : 'rgba(17,17,17,0.4)';
  ctx.fillText(BRAND_TEXT, centerX, layout.brandTopIn * s);
}

export function canvasMeasure(ctx: CanvasRenderingContext2D): MeasureText {
  const probePx = 100;
  return (text, sizeIn, weight) => {
    ctx.font = canvasFont(weight, probePx);
    return (ctx.measureText(text).width / probePx) * sizeIn;
  };
}
