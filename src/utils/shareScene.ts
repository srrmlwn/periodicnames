import type { NameResult } from '../types';
import { createElementLayout } from './elementRenderer';
import type { ElementRenderItem } from './elementRenderer';
import { matchNameToElements } from './elementMatcher';
import { BRAND, LOGO_PALETTE } from './colorSchemes';
import { ELEMENT_POSITIONS, canvasFont, drawElementTile, roundRectPath } from './canvasTile';
import { getFunStatsLine } from './funStats';

export type ShareFormat = 'reel' | 'story' | 'post' | 'wide';

export const SHARE_SIZES: Record<ShareFormat, { width: number; height: number }> = {
  reel: { width: 1080, height: 1920 },
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1350 },
  wide: { width: 1200, height: 630 },
};

export const SHARE_CTA = 'Spell your name at periodicnames.com';
export const SHARE_HEADLINE = 'Spelled in periodic table elements';
export const SHARE_HOOK = "What's your name in elements?";

interface FormatSpec {
  top: number;
  bottom: number;
  side: number;
  logoTile: number;
  headSize: number;
  nameTileMax: number;
  nameMaxH: number;
  stickerSize: number;
  ctaSize: number;
  gap: number;
  tableW: number;
  dot: number;
}

const TALL: FormatSpec = {
  top: 220, bottom: 1420, side: 140, logoTile: 50, headSize: 46, nameTileMax: 200, nameMaxH: 470,
  stickerSize: 32, ctaSize: 34, gap: 40, tableW: 620, dot: 30,
};

const SPECS: Record<ShareFormat, FormatSpec> = {
  reel: TALL,
  story: TALL,
  post: {
    top: 56, bottom: 1300, side: 80, logoTile: 48, headSize: 44, nameTileMax: 200, nameMaxH: 430,
    stickerSize: 30, ctaSize: 34, gap: 36, tableW: 580, dot: 30,
  },
  wide: {
    top: 26, bottom: 606, side: 70, logoTile: 30, headSize: 30, nameTileMax: 132, nameMaxH: 230,
    stickerSize: 22, ctaSize: 24, gap: 20, tableW: 0, dot: 24,
  },
};

const INTRO = { hookSize: 54, inputH: 88, tableW: 800, cardScaleMax: 0.72 };

interface Placed {
  item: ElementRenderItem;
  x: number;
  y: number;
  order: number;
}

interface TileBlock {
  tile: number;
  width: number;
  height: number;
  placed: Placed[];
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TableGeom {
  x: number;
  y: number;
  cell: number;
}

interface IntroLayout {
  logoY: number;
  hookY: number;
  input: Box;
  table: TableGeom;
  cardX: number;
  cardY: number;
  cardScale: number;
}

export interface ShareScene {
  format: ShareFormat;
  width: number;
  height: number;
  name: string;
  spec: FormatSpec;
  logo: TileBlock & { x: number; y: number };
  headline: { text: string; size: number; y: number };
  card: Box;
  tiles: TileBlock & { x: number; y: number };
  sticker: { lines: string[]; size: number; cx: number; cy: number; h: number; w: number };
  table: TableGeom | null;
  litSymbols: Map<string, { color: string; order: number }>;
  cta: { size: number; cx: number; cy: number; w: number; h: number };
  intro: IntroLayout | null;
}

export interface SceneTimeline {
  typeStart: number;
  charMs: number;
  typeEnd: number;
  submitAt: number;
  cardIn: number;
  tileStarts: number[];
  finaleStart: number;
  finaleEnd: number;
  stickerIn: number;
  ctaIn: number;
  end: number;
}

const TILE_POP_MS = 360;
const TILE_IMPACT_MS = 140;
const CTA_IN_MS = 420;
const FINALE_MS = 650;
const FINAL_HOLD_MS = 3000;
const PRESS_MS = 160;

type Measure = (text: string, weight: number, size: number) => number;

function splitWords(items: ElementRenderItem[]): ElementRenderItem[][] {
  const words: ElementRenderItem[][] = [];
  let cur: ElementRenderItem[] = [];
  for (const item of items) {
    if (item.type === 'space') {
      if (cur.length > 0) words.push(cur);
      cur = [];
    } else {
      cur.push(item);
    }
  }
  if (cur.length > 0) words.push(cur);
  return words;
}

function fitTileBlock(words: ElementRenderItem[][], maxW: number, maxH: number, maxTile: number, minTile: number): TileBlock {
  for (let tile = maxTile; ; tile -= 2) {
    const gap = tile * 0.09;
    const wordGap = tile * 0.26;
    const rowGap = tile * 0.14;
    const shadow = tile * 0.07;
    const wordW = (w: ElementRenderItem[]) => w.length * tile + (w.length - 1) * gap;
    const last = tile <= minTile;
    if (!last && Math.max(...words.map(wordW)) + shadow > maxW) continue;

    const rows: { words: ElementRenderItem[][]; width: number }[] = [];
    for (const word of words) {
      const row = rows[rows.length - 1];
      if (row && row.width + wordGap + wordW(word) + shadow <= maxW) {
        row.words.push(word);
        row.width += wordGap + wordW(word);
      } else {
        rows.push({ words: [word], width: wordW(word) });
      }
    }
    const height = rows.length * tile + (rows.length - 1) * rowGap + shadow;
    if (!last && height > maxH) continue;

    const width = Math.max(...rows.map(r => r.width)) + shadow;
    const placed: Placed[] = [];
    rows.forEach((row, ri) => {
      let x = (width - shadow - row.width) / 2;
      const y = ri * (tile + rowGap);
      row.words.forEach((word, wi) => {
        if (wi > 0) x += wordGap;
        word.forEach((item, ti) => {
          if (ti > 0) x += gap;
          placed.push({ item, x, y, order: placed.length });
          x += tile;
        });
      });
    });
    return { tile, width, height, placed };
  }
}

function logoItems(): ElementRenderItem[] {
  const title = matchNameToElements('Periodic Names');
  let i = 0;
  return createElementLayout(title).items.map(item =>
    item.type === 'space' ? item : { ...item, color: LOGO_PALETTE[i++ % LOGO_PALETTE.length] });
}

const LOGO_ITEMS = logoItems();

function splitSticker(text: string, measure: Measure, size: number, maxW: number): { lines: string[]; size: number } {
  for (let s = size; s >= size * 0.78; s -= 1) {
    if (measure(text, 700, s) <= maxW) return { lines: [text], size: s };
  }
  const dash = text.indexOf(' — ');
  const lines = dash > 0 ? [text.slice(0, dash + 2), text.slice(dash + 3)] : [text];
  let s = size;
  while (s > size * 0.6 && Math.max(...lines.map(l => measure(l, 700, s))) > maxW) s -= 1;
  return { lines, size: s };
}

function fitSize(text: string, measure: Measure, size: number, maxW: number): number {
  let s = size;
  while (s > size * 0.5 && measure(text, 700, s) > maxW) s -= 1;
  return s;
}

function buildIntro(
  spec: FormatSpec, width: number, logoH: number, card: Box, cardBottomExtra: number,
): IntroLayout {
  const contentW = width - spec.side * 2;
  let y = spec.top;
  const logoY = y;
  y += logoH + spec.gap * 0.8;
  const hookY = y;
  y += INTRO.hookSize * 1.2 + spec.gap * 0.6;
  const input: Box = { x: (width - contentW * 0.86) / 2, y, w: contentW * 0.86, h: INTRO.inputH };
  y += INTRO.inputH + spec.gap;
  const tableCell = Math.min(INTRO.tableW, contentW) / 18;
  const table: TableGeom = { x: (width - tableCell * 18) / 2, y, cell: tableCell };
  y += tableCell * 9.4 + spec.gap;
  const room = spec.bottom - y;
  const cardScale = Math.max(0.3, Math.min(INTRO.cardScaleMax, room / (card.h + cardBottomExtra)));
  return { logoY, hookY, input, table, cardX: (width - card.w * cardScale) / 2, cardY: y, cardScale };
}

export function buildShareScene(result: NameResult, format: ShareFormat, measure: Measure, headlineText = SHARE_HEADLINE): ShareScene {
  const { width, height } = SHARE_SIZES[format];
  const spec = SPECS[format];
  const contentW = width - spec.side * 2;

  const logo = fitTileBlock(splitWords(LOGO_ITEMS), contentW, spec.logoTile * 2.4, spec.logoTile, spec.logoTile * 0.6);
  const headSize = fitSize(headlineText, measure, spec.headSize, contentW);
  const headH = headSize * 1.2;

  const tilesBlock = fitTileBlock(splitWords(createElementLayout(result).items), contentW - 60, spec.nameMaxH, spec.nameTileMax, 40);
  const pad = Math.max(spec.gap * 0.8, tilesBlock.tile * 0.24);
  const cardW = Math.min(contentW, tilesBlock.width + pad * 2);

  const statsText = getFunStatsLine(result.realElementsCount, result.totalElements);
  const stickerPadX = spec.stickerSize * 0.7;
  const stickerFit = splitSticker(statsText, measure, spec.stickerSize, Math.max(cardW * 0.9, contentW * 0.6) - stickerPadX * 2);
  const stickerH = stickerFit.lines.length * stickerFit.size * 1.25 + stickerFit.size * 0.9;
  const stickerW = Math.max(...stickerFit.lines.map(l => measure(l, 700, stickerFit.size))) + stickerPadX * 2;
  const cardH = pad + tilesBlock.height + pad * 0.5 + stickerH * 0.5;

  const ctaSize = fitSize(SHARE_CTA, measure, spec.ctaSize, contentW - spec.ctaSize * 1.6);
  const ctaH = ctaSize * 2;
  const ctaW = measure(SHARE_CTA, 700, ctaSize) + ctaSize * 1.6;

  const region = spec.bottom - spec.top;
  const fixedH = logo.height + spec.gap + headH + spec.gap * 0.6 + cardH + stickerH * 0.5 + spec.gap + ctaH;
  let tableCell = spec.tableW / 18;
  if (spec.tableW > 0) tableCell = Math.max(0, Math.min(tableCell, (region - fixedH - spec.gap) / 9.4));
  const showTable = spec.tableW > 0 && tableCell >= 22;
  const tableH = showTable ? tableCell * 9.4 : 0;
  const total = fixedH + (showTable ? spec.gap + tableH : 0);

  let y = spec.top + Math.max(0, (region - total) / 2);
  const logoPos = { x: (width - logo.width) / 2, y };
  y += logo.height + spec.gap;
  const headline = { text: headlineText, size: headSize, y };
  y += headH + spec.gap * 0.6;

  const card: Box = { x: (width - cardW) / 2, y, w: cardW, h: cardH };
  const tilesPos = { x: (width - tilesBlock.width) / 2, y: card.y + pad };
  const stickerCy = card.y + card.h;
  y = card.y + card.h + stickerH * 0.5 + spec.gap;

  let table: TableGeom | null = null;
  if (showTable) {
    table = { x: (width - tableCell * 18) / 2, y, cell: tableCell };
    y += tableH + spec.gap;
  }

  const litSymbols = new Map<string, { color: string; order: number }>();
  for (const p of tilesBlock.placed) {
    const el = p.item.element;
    if (el && !litSymbols.has(el.symbol)) litSymbols.set(el.symbol, { color: p.item.color, order: p.order });
  }

  return {
    format, width, height, name: result.originalName, spec,
    logo: { ...logo, ...logoPos },
    headline,
    card,
    tiles: { ...tilesBlock, ...tilesPos },
    sticker: { lines: stickerFit.lines, size: stickerFit.size, cx: width / 2, cy: stickerCy, h: stickerH, w: stickerW },
    table,
    litSymbols,
    cta: { size: ctaSize, cx: width / 2, cy: y + ctaH / 2, w: ctaW, h: ctaH },
    intro: format === 'reel' ? buildIntro(spec, width, logo.height, card, stickerH * 0.5) : null,
  };
}

export function sceneTimeline(scene: ShareScene): SceneTimeline {
  const chars = Math.max(1, scene.name.length);
  const typeStart = 550;
  const charMs = Math.min(110, Math.max(45, 1000 / chars));
  const typeEnd = typeStart + chars * charMs;
  const submitAt = typeEnd + 300;
  const cardIn = submitAt + 200;
  const n = scene.tiles.placed.length;
  const stagger = Math.min(260, Math.max(120, 2400 / Math.max(1, n)));
  const tileStarts = scene.tiles.placed.map((_, i) => cardIn + 220 + i * stagger);
  const lastTile = tileStarts.length > 0 ? tileStarts[tileStarts.length - 1] : cardIn;
  const finaleStart = lastTile + TILE_POP_MS + 350;
  const finaleEnd = finaleStart + FINALE_MS;
  const stickerIn = finaleEnd + 50;
  const ctaIn = stickerIn + 380;
  return {
    typeStart, charMs, typeEnd, submitAt, cardIn, tileStarts, finaleStart, finaleEnd, stickerIn, ctaIn,
    end: ctaIn + CTA_IN_MS + FINAL_HOLD_MS,
  };
}

export function tileImpactTimes(timeline: SceneTimeline): number[] {
  return timeline.tileStarts.map(s => s + TILE_IMPACT_MS);
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t: number) => {
  const c1 = 2.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function drawBackground(ctx: CanvasRenderingContext2D, scene: ShareScene): void {
  ctx.fillStyle = BRAND.mist;
  ctx.fillRect(0, 0, scene.width, scene.height);
  const step = scene.spec.dot;
  const r = step * 0.07;
  ctx.fillStyle = 'rgba(30, 50, 90, 0.16)';
  for (let y = step / 2; y < scene.height; y += step) {
    for (let x = step / 2; x < scene.width; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBrutalBox(ctx: CanvasRenderingContext2D, b: Box, fill: string, border: number, shadow: number, radius: number): void {
  roundRectPath(ctx, b.x + shadow, b.y + shadow, b.w, b.h, radius);
  ctx.fillStyle = BRAND.ink;
  ctx.fill();
  roundRectPath(ctx, b.x, b.y, b.w, b.h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = border;
  ctx.strokeStyle = BRAND.ink;
  ctx.stroke();
}

function withTransform(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, rotate: number, alpha: number, draw: () => void): void {
  if (alpha <= 0.01 || scale <= 0.001) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rotate);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cy);
  draw();
  ctx.restore();
}

function drawCenteredText(ctx: CanvasRenderingContext2D, text: string, size: number, cx: number, y: number, alpha: number): void {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = canvasFont(700, size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = BRAND.ink;
  ctx.fillText(text, cx, y);
  ctx.restore();
}

function drawLogo(ctx: CanvasRenderingContext2D, scene: ShareScene, y: number): void {
  const { logo } = scene;
  for (const p of logo.placed) drawElementTile(ctx, p.item, logo.x + p.x, y + p.y, logo.tile);
}

function drawInput(ctx: CanvasRenderingContext2D, scene: ShareScene, intro: IntroLayout, t: number, tl: SceneTimeline, alpha: number): void {
  if (alpha <= 0.01) return;
  const box = intro.input;
  const unit = INTRO.inputH / 1.7;
  const pressed = t >= tl.submitAt && t < tl.submitAt + PRESS_MS;
  const shadow = pressed ? 0 : unit * 0.16;
  const shift = pressed ? unit * 0.12 : 0;
  const b: Box = { x: box.x + shift, y: box.y + shift, w: box.w, h: box.h };
  const radius = unit * 0.3;
  const border = unit * 0.12;

  ctx.save();
  ctx.globalAlpha *= alpha;
  drawBrutalBox(ctx, b, BRAND.paper, border, shadow, radius);

  ctx.font = canvasFont(700, unit * 0.62);
  const goW = ctx.measureText('Go →').width + unit * 1.1;
  const goX = b.x + b.w - goW;
  ctx.save();
  roundRectPath(ctx, b.x, b.y, b.w, b.h, radius);
  ctx.clip();
  ctx.fillStyle = BRAND.yellow;
  ctx.fillRect(goX, b.y, goW, b.h);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(goX, b.y);
  ctx.lineTo(goX, b.y + b.h);
  ctx.lineWidth = border;
  ctx.strokeStyle = BRAND.ink;
  ctx.stroke();
  roundRectPath(ctx, b.x, b.y, b.w, b.h, radius);
  ctx.stroke();
  ctx.fillStyle = BRAND.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Go →', goX + goW / 2, b.y + b.h / 2);

  const typed = Math.max(0, Math.min(scene.name.length, Math.floor((t - tl.typeStart) / tl.charMs) + 1));
  const text = t < tl.typeStart ? '' : scene.name.slice(0, typed);
  const textX = b.x + unit * 0.5;
  const maxTextW = goX - textX - unit * 0.4;
  let size = unit * 0.95;
  ctx.font = canvasFont(700, size);
  while (size > unit * 0.45 && ctx.measureText(scene.name).width > maxTextW) {
    size -= 2;
    ctx.font = canvasFont(700, size);
  }
  ctx.textAlign = 'left';
  ctx.fillText(text, textX, b.y + b.h / 2);
  if (t < tl.submitAt && (t < tl.typeEnd || Math.floor(t / 260) % 2 === 0)) {
    const cx = textX + ctx.measureText(text).width + 4;
    ctx.fillRect(cx, b.y + b.h / 2 - size * 0.55, Math.max(4, unit * 0.07), size * 1.1);
  }
  ctx.restore();
}

function drawCardAndTiles(ctx: CanvasRenderingContext2D, scene: ShareScene, t: number, tl: SceneTimeline | null): void {
  const p = tl ? clamp01((t - tl.cardIn) / 320) : 1;
  if (p <= 0) return;
  const { card, tiles } = scene;
  const unit = scene.spec.stickerSize;
  withTransform(ctx, card.x + card.w / 2, card.y + card.h / 2, 0.85 + 0.15 * easeOutBack(p), 0, clamp01(p * 3), () => {
    drawBrutalBox(ctx, card, BRAND.paper, unit * 0.18, unit * 0.36, unit * 0.5);
  });
  for (const pl of tiles.placed) {
    const x = tiles.x + pl.x;
    const y = tiles.y + pl.y;
    if (!tl) {
      drawElementTile(ctx, pl.item, x, y, tiles.tile);
      continue;
    }
    const q = clamp01((t - tl.tileStarts[pl.order]) / TILE_POP_MS);
    if (q <= 0) continue;
    const scale = 0.25 + 0.75 * easeOutBack(q);
    const spin = (pl.order % 2 === 0 ? -1 : 1) * 0.26 * (1 - easeOutCubic(q));
    const drop = -(1 - easeOutCubic(q)) * tiles.tile * 0.7;
    ctx.save();
    ctx.translate(0, drop);
    withTransform(ctx, x + tiles.tile / 2, y + tiles.tile / 2, scale, spin, clamp01(q * 4), () => {
      drawElementTile(ctx, pl.item, x, y, tiles.tile);
    });
    ctx.restore();
  }
}

function drawSticker(ctx: CanvasRenderingContext2D, scene: ShareScene, t: number, tl: SceneTimeline | null): void {
  const s = scene.sticker;
  const p = tl ? clamp01((t - tl.stickerIn) / 300) : 1;
  if (p <= 0) return;
  const scale = 1.7 - 0.7 * easeOutCubic(p);
  withTransform(ctx, s.cx, s.cy, scale, -0.035, clamp01(p * 2.5), () => {
    const box: Box = { x: s.cx - s.w / 2, y: s.cy - s.h / 2, w: s.w, h: s.h };
    drawBrutalBox(ctx, box, BRAND.paper, s.size * 0.11, s.size * 0.18, s.size * 0.32);
    ctx.font = canvasFont(700, s.size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = BRAND.ink;
    const lineH = s.size * 1.25;
    const firstY = s.cy - ((s.lines.length - 1) * lineH) / 2;
    s.lines.forEach((line, i) => ctx.fillText(line, s.cx, firstY + i * lineH));
  });
}

function drawTable(ctx: CanvasRenderingContext2D, scene: ShareScene, geom: TableGeom, t: number, tl: SceneTimeline | null): void {
  const { cell } = geom;
  const pad = cell * 0.08;
  const size = cell - pad * 2;
  const radius = cell * 0.12;
  ctx.save();
  for (const [symbol, row, col] of ELEMENT_POSITIONS) {
    const x = geom.x + col * cell + pad;
    const y = geom.y + (row <= 6 ? row : row + 0.4) * cell + pad;
    const lit = scene.litSymbols.get(symbol);
    const litAt = lit && tl ? tl.tileStarts[lit.order] + TILE_IMPACT_MS : -Infinity;
    if (lit && t >= litAt) {
      const q = tl ? clamp01((t - litAt) / 260) : 1;
      const scale = 1 + 0.6 * (1 - easeOutCubic(q));
      withTransform(ctx, x + size / 2, y + size / 2, scale, 0, 1, () => {
        roundRectPath(ctx, x + cell * 0.06, y + cell * 0.06, size, size, radius);
        ctx.fillStyle = BRAND.ink;
        ctx.fill();
        roundRectPath(ctx, x, y, size, size, radius);
        ctx.fillStyle = lit.color;
        ctx.fill();
        ctx.lineWidth = Math.max(2, cell * 0.06);
        ctx.strokeStyle = BRAND.ink;
        ctx.stroke();
        ctx.font = canvasFont(700, cell * 0.4);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = BRAND.ink;
        ctx.fillText(symbol, x + size / 2, y + size / 2 + cell * 0.02);
      });
    } else {
      roundRectPath(ctx, x, y, size, size, radius);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, cell * 0.035);
      ctx.strokeStyle = 'rgba(17,17,17,0.16)';
      ctx.stroke();
      ctx.font = canvasFont(600, cell * 0.34);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(17,17,17,0.3)';
      ctx.fillText(symbol, x + size / 2, y + size / 2 + cell * 0.02);
    }
  }
  ctx.restore();
}

function drawCta(ctx: CanvasRenderingContext2D, scene: ShareScene, t: number, tl: SceneTimeline | null): void {
  const c = scene.cta;
  const p = tl ? clamp01((t - tl.ctaIn) / CTA_IN_MS) : 1;
  if (p <= 0) return;
  ctx.save();
  ctx.translate(0, (1 - easeOutBack(p)) * c.h * 1.2);
  withTransform(ctx, c.cx, c.cy, 1, 0.02, clamp01(p * 3), () => {
    const box: Box = { x: c.cx - c.w / 2, y: c.cy - c.h / 2, w: c.w, h: c.h };
    drawBrutalBox(ctx, box, BRAND.yellow, c.size * 0.1, c.size * 0.16, c.size * 0.3);
    ctx.font = canvasFont(700, c.size);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = BRAND.ink;
    ctx.fillText(SHARE_CTA, c.cx, c.cy + c.size * 0.04);
  });
  ctx.restore();
}

function shakeOffset(scene: ShareScene, t: number, tl: SceneTimeline): number {
  const amp = scene.tiles.tile * 0.04;
  let offset = 0;
  for (const impact of tileImpactTimes(tl)) {
    const dt = t - impact;
    if (dt >= 0 && dt < 160) offset += Math.sin(dt / 18) * amp * (1 - dt / 160);
  }
  return offset;
}

export function drawShareScene(ctx: CanvasRenderingContext2D, scene: ShareScene, t = Infinity, tl: SceneTimeline | null = null): void {
  const timeline = tl !== null && Number.isFinite(t) && scene.intro ? tl : null;
  const intro = timeline ? scene.intro : null;
  const f = timeline ? easeInOutCubic(clamp01((t - timeline.finaleStart) / FINALE_MS)) : 1;

  drawBackground(ctx, scene);
  ctx.save();
  if (timeline) ctx.translate(shakeOffset(scene, t, timeline), 0);

  drawLogo(ctx, scene, intro ? lerp(intro.logoY, scene.logo.y, f) : scene.logo.y);

  if (intro && timeline) {
    const hookIn = clamp01(t / 350);
    const introOut = 1 - clamp01(f * 3);
    drawCenteredText(ctx, SHARE_HOOK, INTRO.hookSize, scene.width / 2, intro.hookY - f * 40, hookIn * introOut);
    drawInput(ctx, scene, intro, t, timeline, introOut);
  }
  drawCenteredText(ctx, scene.headline.text, scene.headline.size, scene.width / 2, scene.headline.y, clamp01((f - 0.55) / 0.45));

  const finalTable = scene.table;
  if (intro && finalTable) {
    drawTable(ctx, scene, {
      x: lerp(intro.table.x, finalTable.x, f),
      y: lerp(intro.table.y, finalTable.y, f),
      cell: lerp(intro.table.cell, finalTable.cell, f),
    }, t, timeline);
  } else if (finalTable) {
    drawTable(ctx, scene, finalTable, t, timeline);
  }

  ctx.save();
  if (intro) {
    const s = lerp(intro.cardScale, 1, f);
    ctx.translate(lerp(intro.cardX, scene.card.x, f), lerp(intro.cardY, scene.card.y, f));
    ctx.scale(s, s);
    ctx.translate(-scene.card.x, -scene.card.y);
  }
  drawCardAndTiles(ctx, scene, t, timeline);
  ctx.restore();

  drawSticker(ctx, scene, t, timeline);
  drawCta(ctx, scene, t, timeline);
  ctx.restore();
}

export function canvasTextMeasure(ctx: CanvasRenderingContext2D): Measure {
  return (text, weight, size) => {
    ctx.font = canvasFont(weight, size);
    return ctx.measureText(text).width;
  };
}
