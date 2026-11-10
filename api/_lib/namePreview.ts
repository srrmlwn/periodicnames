import { join } from 'path';
import { Resvg } from '@resvg/resvg-js';
import { matchNameToElements } from './spelling/elementMatcher';
import { BRAND, NEW_RIBBON_LABEL, getTileColors } from './spelling/colorSchemes';
import { fakeAtomicNumber } from './spelling/fakeElements';
import { isOffensiveName } from './textFilter';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const MAX_NAME_LENGTH = 30;
const FONT_FAMILY = 'Space Grotesk';
const FONT_DIR = join(__dirname, 'fonts');

interface Tile {
  symbol: string;
  name: string;
  number: number;
  color: string;
  isNew: boolean;
}

export function nameFromSlug(slug: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    return null;
  }
  const name = decoded
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  if (!name || name.length > MAX_NAME_LENGTH || !/^[a-z ]+$/i.test(name)) return null;
  if (isOffensiveName(name)) return null;
  return name;
}

function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

function nameToWords(name: string): Tile[][] {
  const result = matchNameToElements(name);
  const colors = getTileColors(result);
  const words: Tile[][] = [[]];
  result.orderedElements.forEach((el, i) => {
    if (el.symbol === ' ') {
      words.push([]);
      return;
    }
    const isNew = !('atomicNumber' in el);
    words[words.length - 1].push({
      symbol: el.symbol,
      name: el.name,
      number: 'atomicNumber' in el ? el.atomicNumber : fakeAtomicNumber(el.name),
      color: colors[i],
      isNew,
    });
  });
  return words.filter(w => w.length > 0);
}

function tileSvg(tile: Tile, x: number, y: number, size: number, id: string): string {
  const r = size * 0.08;
  const border = Math.max(3, size * 0.045);
  const shadow = size * 0.07;
  const clipId = `clip-${id}`;
  const ribbon = tile.isNew
    ? `<g clip-path="url(#${clipId})"><g transform="translate(${x + size} ${y}) rotate(45)">` +
      `<rect x="${-size}" y="${size * 0.2 - size * 0.07}" width="${size * 2}" height="${size * 0.14}" fill="${BRAND.ink}"/>` +
      `<text x="0" y="${size * 0.2 + size * 0.035}" font-size="${size * 0.1}" font-weight="700" fill="${BRAND.paper}" text-anchor="middle">${NEW_RIBBON_LABEL}</text>` +
      `</g></g>`
    : '';
  const label = tile.name.length > 12 ? tile.name.slice(0, 11) + '…' : tile.name;
  return (
    `<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}"/></clipPath>` +
    `<rect x="${x + shadow}" y="${y + shadow}" width="${size}" height="${size}" rx="${r}" fill="${BRAND.ink}"/>` +
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="${tile.color}"/>` +
    ribbon +
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="none" stroke="${BRAND.ink}" stroke-width="${border}"/>` +
    `<text x="${x + size * 0.09}" y="${y + size * 0.2}" font-size="${size * 0.14}" font-weight="700" fill="${BRAND.ink}" fill-opacity="0.75">${tile.number}</text>` +
    `<text x="${x + size / 2}" y="${y + size * 0.65}" font-size="${size * 0.42}" font-weight="700" fill="${BRAND.ink}" text-anchor="middle">${escapeXml(tile.symbol)}</text>` +
    `<text x="${x + size / 2}" y="${y + size * 0.9}" font-size="${size * 0.12}" font-weight="500" fill="${BRAND.ink}" text-anchor="middle">${escapeXml(label)}</text>`
  );
}

const MAX_SINGLE_ROW_SLOTS = 8;
const MAX_ROW_TILES = 9;

function layoutRows(words: Tile[][]): (Tile | null)[][] {
  const singleRow = words.flatMap<Tile | null>((w, i) => (i === 0 ? w : [null, ...w]));
  if (singleRow.length <= MAX_SINGLE_ROW_SLOTS) return [singleRow];
  return words.flatMap(w => {
    if (w.length <= MAX_ROW_TILES) return [w];
    const half = Math.ceil(w.length / 2);
    return [w.slice(0, half), w.slice(half)];
  });
}

function tilesSvg(words: Tile[][], top: number, areaHeight: number): string {
  const rows = layoutRows(words);
  const maxWidth = OG_WIDTH - 120;
  const longest = Math.max(...rows.map(r => r.length));
  const gapRatio = 0.12;
  const byWidth = maxWidth / (longest + (longest - 1) * gapRatio + 0.07);
  const byHeight = areaHeight / (rows.length + (rows.length - 1) * gapRatio * 1.5 + 0.07);
  const size = Math.min(200, byWidth, byHeight);
  const gap = size * gapRatio;
  const blockHeight = rows.length * size + (rows.length - 1) * gap * 1.5;
  let y = top + (areaHeight - blockHeight) / 2;
  const parts: string[] = [];
  rows.forEach((row, ri) => {
    const rowWidth = row.length * size + (row.length - 1) * gap;
    let x = (OG_WIDTH - rowWidth) / 2;
    row.forEach((tile, ti) => {
      if (tile) parts.push(tileSvg(tile, x, y, size, `${ri}-${ti}`));
      x += size + gap;
    });
    y += size + gap * 1.5;
  });
  return parts.join('');
}

function background(): string {
  return (
    `<defs><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">` +
    `<circle cx="2" cy="2" r="1.6" fill="${BRAND.ink}" fill-opacity="0.08"/></pattern></defs>` +
    `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${BRAND.mist}"/>` +
    `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#dots)"/>`
  );
}

function ctaSvg(): string {
  const text = 'Spell yours at periodicnames.com';
  const w = 560;
  const h = 64;
  const x = (OG_WIDTH - w) / 2;
  const y = OG_HEIGHT - h - 44;
  return (
    `<rect x="${x + 6}" y="${y + 6}" width="${w}" height="${h}" rx="14" fill="${BRAND.ink}"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${BRAND.yellow}" stroke="${BRAND.ink}" stroke-width="4"/>` +
    `<text x="${OG_WIDTH / 2}" y="${y + h / 2 + 10}" font-size="28" font-weight="700" fill="${BRAND.ink}" text-anchor="middle">${text}</text>`
  );
}

export function namePreviewSvg(name: string): string {
  const headline = `${name} in periodic table elements`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" font-family="${FONT_FAMILY}">` +
    background() +
    `<text x="${OG_WIDTH / 2}" y="84" font-size="40" font-weight="700" fill="${BRAND.ink}" text-anchor="middle">${escapeXml(headline)}</text>` +
    tilesSvg(nameToWords(name), 120, 340) +
    ctaSvg() +
    `</svg>`
  );
}

export function renderNamePreviewPng(name: string): Buffer {
  const resvg = new Resvg(namePreviewSvg(name), {
    font: {
      fontFiles: [join(FONT_DIR, 'SpaceGrotesk-Bold.ttf'), join(FONT_DIR, 'SpaceGrotesk-Medium.ttf')],
      loadSystemFonts: false,
      defaultFontFamily: FONT_FAMILY,
    },
  });
  return resvg.render().asPng();
}
