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

export const SHARE_CTA = 'Spell yours at periodicnames.com';

interface FormatSpec {
  top: number;
  bottom: number;
  side: number;
  logoTile: number;
  nameTileMax: number;
  nameMaxH: number;
  captionSize: number;
  stickerSize: number;
  ctaSize: number;
  gap: number;
  tableW: number;
  dot: number;
}

const TALL: FormatSpec = {
  top: 220, bottom: 1420, side: 140, logoTile: 54, nameTileMax: 150, nameMaxH: 330,
  captionSize: 50, stickerSize: 32, ctaSize: 38, gap: 44, tableW: 800, dot: 30,
};

const SPECS: Record<ShareFormat, FormatSpec> = {
  reel: TALL,
  story: TALL,
  post: {
    top: 56, bottom: 1300, side: 80, logoTile: 52, nameTileMax: 150, nameMaxH: 330,
    captionSize: 46, stickerSize: 30, ctaSize: 36, gap: 42, tableW: 820, dot: 30,
  },
  wide: {
    top: 26, bottom: 606, side: 70, logoTile: 34, nameTileMax: 120, nameMaxH: 200,
    captionSize: 32, stickerSize: 23, ctaSize: 26, gap: 24, tableW: 0, dot: 24,
  },
};

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

export interface ShareScene {
  format: ShareFormat;
  width: number;
  height: number;
  name: string;
  spec: FormatSpec;
  logo: TileBlock & { x: number; y: number };
  card: Box;
  caption: { text: string; size: number; y: number } | null;
  tiles: TileBlock & { x: number; y: number };
  sticker: { lines: string[]; size: number; cx: number; cy: number; h: number; w: number };
  table: { x: number; y: number; cell: number } | null;
  litSymbols: Map<string, { color: string; order: number }>;
  cta: { size: number; cx: number; cy: number; w: number; h: number };
  inputBox: Box;
}

export interface SceneTimeline {
  typeStart: number;
  charMs: number;
  typeEnd: number;
  cardIn: number;
  tileStarts: number[];
  stickerIn: number;
  ctaIn: number;
  end: number;
}

const TILE_POP_MS = 360;
const CTA_IN_MS = 420;
const FINAL_HOLD_MS = 3000;
const SUBMIT_DELAY_MS = 300;
const PRESS_MS = 160;
const TILE_IMPACT_MS = 140;

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
  const items = createElementLayout(title).items;
  let i = 0;
  return items.map(item => item.type === 'space' ? item : { ...item, color: LOGO_PALETTE[i++ % LOGO_PALETTE.length] });
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

export function buildShareScene(result: NameResult, caption: string, format: ShareFormat, measure: Measure): ShareScene {
  const { width, height } = SHARE_SIZES[format];
  const spec = SPECS[format];
  const contentW = width - spec.side * 2;
  const captionText = caption.trim();

  const logo = fitTileBlock(splitWords(LOGO_ITEMS), contentW, spec.logoTile * 2.4, spec.logoTile, spec.logoTile * 0.6);

  const tilesBlock = fitTileBlock(splitWords(createElementLayout(result).items), contentW - 80, spec.nameMaxH, spec.nameTileMax, 40);
  const pad = Math.max(spec.gap * 0.7, tilesBlock.tile * 0.3);
  const captionSize = captionText ? Math.min(spec.captionSize, Math.max(spec.captionSize * 0.6, tilesBlock.tile * 0.34)) : 0;
  let captionFit = captionSize;
  while (captionText && captionFit > 18 && measure(captionText, 700, captionFit) > contentW - pad * 2) captionFit -= 1;
  const captionW = captionText ? measure(captionText, 700, captionFit) : 0;
  const captionBlockH = captionText ? captionFit * 1.25 + tilesBlock.tile * 0.16 : 0;

  const cardW = Math.min(contentW, Math.max(tilesBlock.width, captionW) + pad * 2);

  const statsText = getFunStatsLine(result.realElementsCount, result.totalElements);
  const stickerPadX = spec.stickerSize * 0.7;
  const stickerFit = splitSticker(statsText, measure, spec.stickerSize, Math.max(cardW * 0.85, contentW * 0.6) - stickerPadX * 2);
  const stickerH = stickerFit.lines.length * stickerFit.size * 1.25 + stickerFit.size * 0.9;
  const stickerW = Math.max(...stickerFit.lines.map(l => measure(l, 700, stickerFit.size))) + stickerPadX * 2;
  const cardH = pad + captionBlockH + tilesBlock.height + pad * 0.6 + stickerH * 0.5;

  const ctaH = spec.ctaSize * 2;
  const ctaW = measure(SHARE_CTA, 700, spec.ctaSize) + spec.ctaSize * 1.6;

  const inputH = spec.captionSize * 1.7;
  const inputW = contentW * 0.82;

  const region = spec.bottom - spec.top;
  const fixedH = logo.height + spec.gap + inputH + spec.gap + cardH + stickerH * 0.5 + spec.gap + ctaH;
  let tableCell = spec.tableW / 18;
  if (spec.tableW > 0) {
    const room = region - fixedH - spec.gap;
    tableCell = Math.max(0, Math.min(tableCell, room / 9.4));
  }
  const showTable = spec.tableW > 0 && tableCell >= 24;
  const tableH = showTable ? tableCell * 9.4 : 0;
  const total = fixedH + (showTable ? spec.gap + tableH : 0);

  let y = spec.top + Math.max(0, (region - total) / 2);
  const logoPos = { x: (width - logo.width) / 2, y };
  y += logo.height + spec.gap;

  const inputBox: Box = { x: (width - inputW) / 2, y, w: inputW, h: inputH };
  y += inputH + spec.gap;

  let table: ShareScene['table'] = null;
  if (showTable) {
    table = { x: (width - tableCell * 18) / 2, y, cell: tableCell };
    y += tableH + spec.gap;
  }

  const card: Box = { x: (width - cardW) / 2, y, w: cardW, h: cardH };
  const captionY = card.y + pad;
  const tilesPos = { x: (width - tilesBlock.width) / 2, y: card.y + pad + captionBlockH };
  const stickerCy = card.y + card.h;
  y = card.y + card.h + stickerH * 0.5 + spec.gap;

  const litSymbols = new Map<string, { color: string; order: number }>();
  for (const p of tilesBlock.placed) {
    const el = p.item.element;
    if (el && !litSymbols.has(el.symbol)) litSymbols.set(el.symbol, { color: p.item.color, order: p.order });
  }

  return {
    format, width, height, name: result.originalName, spec,
    logo: { ...logo, ...logoPos },
    card,
    caption: captionText ? { text: captionText, size: captionFit, y: captionY } : null,
    tiles: { ...tilesBlock, ...tilesPos },
    sticker: { lines: stickerFit.lines, size: stickerFit.size, cx: width / 2, cy: stickerCy, h: stickerH, w: stickerW },
    table,
    litSymbols,
    cta: { size: spec.ctaSize, cx: width / 2, cy: y + ctaH / 2, w: ctaW, h: ctaH },
    inputBox,
  };
}

export function sceneTimeline(scene: ShareScene): SceneTimeline {
  const chars = Math.max(1, scene.name.length);
  const typeStart = 300;
  const charMs = Math.min(110, Math.max(45, 1100 / chars));
  const typeEnd = typeStart + chars * charMs;
  const cardIn = typeEnd + SUBMIT_DELAY_MS + 260;
  const n = scene.tiles.placed.length;
  const stagger = Math.min(280, Math.max(140, 2600 / Math.max(1, n)));
  const tileStarts = scene.tiles.placed.map((_, i) => cardIn + 260 + i * stagger);
  const lastTile = tileStarts.length > 0 ? tileStarts[tileStarts.length - 1] : cardIn;
  const stickerIn = lastTile + TILE_POP_MS + 200;
  const ctaIn = stickerIn + 420;
  return { typeStart, charMs, typeEnd, cardIn, tileStarts, stickerIn, ctaIn, end: ctaIn + CTA_IN_MS + FINAL_HOLD_MS };
}

export function tileImpactTimes(timeline: SceneTimeline): number[] {
  return timeline.tileStarts.map(s => s + TILE_IMPACT_MS);
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
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

function drawLogo(ctx: CanvasRenderingContext2D, scene: ShareScene): void {
  const { logo } = scene;
  for (const p of logo.placed) drawElementTile(ctx, p.item, logo.x + p.x, logo.y + p.y, logo.tile);
}

function drawInput(ctx: CanvasRenderingContext2D, scene: ShareScene, t: number, tl: SceneTimeline | null): void {
  const box = scene.inputBox;
  const unit = scene.spec.captionSize;
  const submitAt = tl ? tl.typeEnd + SUBMIT_DELAY_MS : -Infinity;
  const pressed = tl !== null && t >= submitAt && t < submitAt + PRESS_MS;
  const shadow = pressed ? 0 : unit * 0.16;
  const shift = pressed ? unit * 0.12 : 0;
  const b: Box = { x: box.x + shift, y: box.y + shift, w: box.w, h: box.h };
  const radius = unit * 0.3;
  const border = unit * 0.12;

  ctx.save();
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

  const typed = tl ? Math.max(0, Math.min(scene.name.length, Math.floor((t - tl.typeStart) / tl.charMs) + 1)) : scene.name.length;
  const text = tl && t < tl.typeStart ? '' : scene.name.slice(0, typed);
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
  const typing = tl !== null && t < submitAt;
  if (typing && (t < tl.typeEnd || Math.floor(t / 260) % 2 === 0)) {
    const cx = textX + ctx.measureText(text).width + 4;
    ctx.fillRect(cx, b.y + b.h / 2 - size * 0.55, Math.max(4, unit * 0.07), size * 1.1);
  }
  ctx.restore();
}

function drawCard(ctx: CanvasRenderingContext2D, scene: ShareScene, t: number, tl: SceneTimeline | null): void {
  const p = tl ? clamp01((t - tl.cardIn) / 320) : 1;
  if (p <= 0) return;
  const { card } = scene;
  const unit = scene.spec.captionSize;
  withTransform(ctx, card.x + card.w / 2, card.y + card.h / 2, 0.85 + 0.15 * easeOutBack(p), 0, clamp01(p * 3), () => {
    drawBrutalBox(ctx, card, BRAND.paper, unit * 0.12, unit * 0.24, unit * 0.36);
    if (scene.caption) {
      ctx.font = canvasFont(700, scene.caption.size);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = BRAND.ink;
      ctx.fillText(scene.caption.text, card.x + card.w / 2, scene.caption.y);
    }
  });
}

function drawNameTiles(ctx: CanvasRenderingContext2D, scene: ShareScene, t: number, tl: SceneTimeline | null): void {
  const { tiles } = scene;
  for (const p of tiles.placed) {
    const x = tiles.x + p.x;
    const y = tiles.y + p.y;
    if (!tl) {
      drawElementTile(ctx, p.item, x, y, tiles.tile);
      continue;
    }
    const q = clamp01((t - tl.tileStarts[p.order]) / TILE_POP_MS);
    if (q <= 0) continue;
    const scale = 0.25 + 0.75 * easeOutBack(q);
    const spin = (p.order % 2 === 0 ? -1 : 1) * 0.26 * (1 - easeOutCubic(q));
    const drop = -(1 - easeOutCubic(q)) * tiles.tile * 0.7;
    ctx.save();
    ctx.translate(0, drop);
    withTransform(ctx, x + tiles.tile / 2, y + tiles.tile / 2, scale, spin, clamp01(q * 4), () => {
      drawElementTile(ctx, p.item, x, y, tiles.tile);
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

function drawTable(ctx: CanvasRenderingContext2D, scene: ShareScene, t: number, tl: SceneTimeline | null): void {
  const table = scene.table;
  if (!table) return;
  const { cell } = table;
  const pad = cell * 0.08;
  const size = cell - pad * 2;
  const radius = cell * 0.12;
  ctx.save();
  for (const [symbol, row, col] of ELEMENT_POSITIONS) {
    const x = table.x + col * cell + pad;
    const y = table.y + (row <= 6 ? row : row + 0.4) * cell + pad;
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
  const amp = scene.tiles.tile * 0.05;
  let offset = 0;
  for (const impact of tileImpactTimes(tl)) {
    const dt = t - impact;
    if (dt >= 0 && dt < 160) offset += Math.sin(dt / 18) * amp * (1 - dt / 160);
  }
  return offset;
}

export function drawShareScene(ctx: CanvasRenderingContext2D, scene: ShareScene, t = Infinity, tl: SceneTimeline | null = null): void {
  const animated = tl !== null && Number.isFinite(t);
  const timeline = animated ? tl : null;
  drawBackground(ctx, scene);
  ctx.save();
  if (timeline) ctx.translate(shakeOffset(scene, t, timeline), 0);
  drawLogo(ctx, scene);
  drawTable(ctx, scene, t, timeline);
  drawInput(ctx, scene, t, timeline);
  drawCard(ctx, scene, t, timeline);
  drawNameTiles(ctx, scene, t, timeline);
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
