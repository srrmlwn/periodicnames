import type { NameResult } from '../types';
import type { Element } from '../data/elements';
import { getAllElements } from '../data/elements';
import { createElementLayout } from './elementRenderer';
import type { ElementRenderItem } from './elementRenderer';
import { getCategoryColor, getCategoryBorderColor, getFakeElementColor, getFakeElementBorderColor } from './colorSchemes';

const TITLE_COLORS = ['#e03030', '#f97316', '#2563eb', '#059669', '#7c3aed', '#0284c7', '#db2777'];
const STAGGER_MS = 65;
const POP_MS = 450;
const HOLD_MS = 1200;
const TILES_START_MS = 1800;
const TEXT_FADE_IN_END = 700;
const TEXT_HOLD_END = 1600;
const TEXT_FADE_OUT_END = 2000;
const CANVAS_SIZE = 1080;
const FPS = 30;

// [symbol, row (0-8), col (0-17)]; rows 7-8 are lanthanides/actinides with a half-cell gap below row 6
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

interface TileAnim { scale: number; opacity: number; dy: number }

function animForProgress(t: number): TileAnim {
  if (t <= 0) return { scale: 0.5, opacity: 0, dy: 8 };
  if (t >= 1) return { scale: 1, opacity: 1, dy: 0 };
  type KF = [number, number, number, number];
  const kfs: KF[] = [[0, 0.5, 0, 8], [0.6, 1.1, 1, -2], [0.8, 0.95, 1, 0], [1, 1, 1, 0]];
  let i = 0;
  while (i < kfs.length - 2 && kfs[i + 1][0] <= t) i++;
  const [t0, s0, a0, y0] = kfs[i];
  const [t1, s1, a1, y1] = kfs[i + 1];
  const f = (t - t0) / (t1 - t0);
  return { scale: s0 + (s1 - s0) * f, opacity: a0 + (a1 - a0) * f, dy: y0 + (y1 - y0) * f };
}

export class ShareVideoGenerator {
  static isSupported(): boolean {
    if (typeof MediaRecorder === 'undefined') return false;
    return (
      MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ||
      MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ||
      MediaRecorder.isTypeSupported('video/webm')
    );
  }

  getEstimatedDurationMs(result: NameResult): number {
    const numTiles = result.orderedElements.filter(e => e.symbol !== ' ').length;
    return TILES_START_MS + Math.max(numTiles - 1, 0) * STAGGER_MS + POP_MS + HOLD_MS;
  }

  async generateReelVideo(
    result: NameResult,
    onProgress?: (ratio: number) => void
  ): Promise<Blob> {
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const mimeType =
      ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(
        m => MediaRecorder.isTypeSupported(m)
      ) ?? 'video/webm';

    const stream = canvas.captureStream(FPS);
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    const totalDuration = this.getEstimatedDurationMs(result);

    return new Promise((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
      recorder.onerror = reject;
      recorder.start(100);
      this.runAnimation(canvas, result, totalDuration, onProgress, () => {
        recorder.requestData();
        recorder.stop();
        stream.getTracks().forEach(t => t.stop());
      });
    });
  }

  private runAnimation(
    canvas: HTMLCanvasElement,
    result: NameResult,
    totalDuration: number,
    onProgress: ((ratio: number) => void) | undefined,
    onComplete: () => void
  ): void {
    const ctx = canvas.getContext('2d')!;
    const layout = createElementLayout(result);

    const padding = 80;
    const titleSize = 68;
    const titleY = padding + titleSize;
    const urlSize = 26;
    const urlBaselineY = CANVAS_SIZE - 40;
    const contentTop = titleY + titleSize * 0.2 + 24;
    const contentBottom = urlBaselineY - urlSize - 16;
    const availableWidth = CANVAS_SIZE - padding * 2;
    const availableHeight = contentBottom - contentTop;

    // Responsive tile layout: largest tiles that fit the available space
    const { tileSize, rows, tileGap, wordGap, rowGap } =
      this.computeOptimalLayout(layout, availableWidth, availableHeight);

    const totalRowsHeight = rows.length * tileSize + Math.max(0, rows.length - 1) * rowGap;
    const tilesStartY = contentTop + Math.max(0, (availableHeight - totalRowsHeight) / 2);

    // Size the text font to match the widest tile row so they look the same scale
    let maxTileRowWidth = 0;
    rows.forEach(row => {
      let w = 0;
      row.forEach((word, wi) => {
        if (wi > 0) w += wordGap;
        w += word.length * tileSize + Math.max(0, word.length - 1) * tileGap;
      });
      maxTileRowWidth = Math.max(maxTileRowWidth, w);
    });
    const REF = 300;
    ctx.font = `900 ${REF}px "Nunito", "Arial Black", sans-serif`;
    const refWidth = ctx.measureText(result.originalName).width;
    const nameFontSize = Math.min(Math.round(REF * maxTileRowWidth / refWidth), REF);

    // Pre-render the faded periodic table background once
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = CANVAS_SIZE;
    bgCanvas.height = CANVAS_SIZE;
    this.drawPeriodicTableBackground(bgCanvas.getContext('2d')!, CANVAS_SIZE, CANVAS_SIZE);

    const tileStarts = new Map<ElementRenderItem, number>();
    let idx = 0;
    layout.items.forEach(item => {
      if (item.type !== 'space') tileStarts.set(item, TILES_START_MS + idx++ * STAGGER_MS);
    });

    const slug = result.originalName.toLowerCase().replace(/\s+/g, '-');
    const startEpoch = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startEpoch;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.drawImage(bgCanvas, 0, 0);

      this.drawColorfulTitle(ctx, 'Periodic Names', CANVAS_SIZE / 2, titleY, titleSize);

      // Text intro phase
      const nameOpacity = elapsed < TEXT_FADE_IN_END
        ? elapsed / TEXT_FADE_IN_END
        : elapsed < TEXT_HOLD_END
          ? 1
          : elapsed < TEXT_FADE_OUT_END
            ? 1 - (elapsed - TEXT_HOLD_END) / (TEXT_FADE_OUT_END - TEXT_HOLD_END)
            : 0;
      const nameScale = elapsed < TEXT_FADE_IN_END
        ? 0.85 + 0.15 * (elapsed / TEXT_FADE_IN_END)
        : elapsed < TEXT_HOLD_END
          ? 1
          : 1 - 0.08 * ((elapsed - TEXT_HOLD_END) / (TEXT_FADE_OUT_END - TEXT_HOLD_END));

      if (nameOpacity > 0.01) {
        this.drawNameText(ctx, result.originalName, nameFontSize, nameOpacity, nameScale,
          (contentTop + contentBottom) / 2);
      }

      rows.forEach((row, ri) => {
        let rowWidth = 0;
        row.forEach((word, wi) => {
          if (wi > 0) rowWidth += wordGap;
          rowWidth += word.length * tileSize + Math.max(0, word.length - 1) * tileGap;
        });
        let x = (CANVAS_SIZE - rowWidth) / 2;
        const y = tilesStartY + ri * (tileSize + rowGap);
        row.forEach((word, wi) => {
          if (wi > 0) x += wordGap;
          word.forEach((item, ti) => {
            if (ti > 0) x += tileGap;
            const start = tileStarts.get(item) ?? 0;
            const progress = Math.min(1, Math.max(0, (elapsed - start) / POP_MS));
            this.drawAnimatedTile(ctx, item, x, y, tileSize, animForProgress(progress));
            x += tileSize;
          });
        });
      });

      ctx.font = `700 ${urlSize}px "Nunito", Arial, sans-serif`;
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`periodicnames.com/${slug}`, CANVAS_SIZE / 2, urlBaselineY);

      onProgress?.(Math.min(1, elapsed / totalDuration));

      if (elapsed < totalDuration) {
        requestAnimationFrame(frame);
      } else {
        requestAnimationFrame(onComplete);
      }
    };

    requestAnimationFrame(frame);
  }

  private computeOptimalLayout(
    layout: { items: ElementRenderItem[] },
    availableWidth: number,
    availableHeight: number
  ): { tileSize: number; rows: ElementRenderItem[][][]; tileGap: number; wordGap: number; rowGap: number } {
    // Pre-group into words once (groupings are independent of tile size)
    const words: ElementRenderItem[][] = [];
    let cur: ElementRenderItem[] = [];
    for (const item of layout.items) {
      if (item.type === 'space') {
        if (cur.length > 0) { words.push(cur); cur = []; }
      } else { cur.push(item); }
    }
    if (cur.length > 0) words.push(cur);
    const maxWordLen = Math.max(1, ...words.map(w => w.length));

    for (let tileSize = 200; tileSize >= 60; tileSize -= 4) {
      const tileGap = Math.round(tileSize * 0.09);
      const wordGap = Math.round(tileSize * 0.20);
      const rowGap = Math.round(tileSize * 0.12);

      // Ensure the widest single word fits on one row
      if (maxWordLen * tileSize + (maxWordLen - 1) * tileGap > availableWidth) continue;

      const rows = this.buildWordRows(layout.items, tileSize, tileGap, wordGap, availableWidth);
      const totalHeight = rows.length * tileSize + Math.max(0, rows.length - 1) * rowGap;
      if (totalHeight <= availableHeight) return { tileSize, rows, tileGap, wordGap, rowGap };
    }

    const tileSize = 60;
    return { tileSize, rows: this.buildWordRows(layout.items, tileSize, 5, 12, availableWidth), tileGap: 5, wordGap: 12, rowGap: 7 };
  }

  private drawNameText(
    ctx: CanvasRenderingContext2D,
    name: string,
    fontSize: number,
    opacity: number,
    scale: number,
    centerY: number
  ): void {
    ctx.font = `900 ${fontSize}px "Nunito", "Arial Black", sans-serif`;
    const chars = name.split('').map(ch => ({ ch, w: ctx.measureText(ch).width }));
    const totalWidth = chars.reduce((s, c) => s + c.w, 0);

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(CANVAS_SIZE / 2, centerY);
    ctx.scale(scale, scale);

    let x = -totalWidth / 2;
    let ci = 0;
    for (const { ch, w } of chars) {
      if (ch !== ' ') {
        const color = TITLE_COLORS[ci++ % TITLE_COLORS.length];
        ctx.lineWidth = fontSize * 0.065;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#111111';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.strokeText(ch, x, 0);
        ctx.fillStyle = color;
        ctx.fillText(ch, x, 0);
      }
      x += w;
    }

    ctx.restore();
  }

  private drawPeriodicTableBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
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
      this.roundRectPath(ctx, x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2, cellSize * 0.1);
      ctx.fillStyle = getCategoryColor(category);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private buildWordRows(
    items: ElementRenderItem[],
    tileSize: number,
    tileGap: number,
    wordGap: number,
    maxWidth: number
  ): ElementRenderItem[][][] {
    const words: ElementRenderItem[][] = [];
    let cur: ElementRenderItem[] = [];
    for (const item of items) {
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

  private drawAnimatedTile(
    ctx: CanvasRenderingContext2D,
    item: ElementRenderItem,
    x: number, y: number, size: number,
    anim: TileAnim
  ): void {
    if (anim.opacity <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = anim.opacity;
    ctx.translate(x + size / 2, y + size / 2 + anim.dy * (size / 64));
    ctx.scale(anim.scale, anim.scale);
    this.drawTile(ctx, item, -size / 2, -size / 2, size);
    ctx.restore();
  }

  private drawTile(ctx: CanvasRenderingContext2D, item: ElementRenderItem, x: number, y: number, size: number): void {
    const isFake = !!item.fakeElement;
    const el = item.element || item.fakeElement;
    if (!el) return;

    const bgColor = isFake ? getFakeElementColor() : getCategoryColor((el as Element).category);
    const borderColor = isFake ? getFakeElementBorderColor() : getCategoryBorderColor((el as Element).category);
    const radius = size * 0.1;
    const borderWidth = Math.max(2, size * 0.03);

    this.roundRectPath(ctx, x, y, size, size, radius);
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

  private drawColorfulTitle(ctx: CanvasRenderingContext2D, text: string, centerX: number, baselineY: number, fontSize: number): void {
    ctx.font = `900 ${fontSize}px "Nunito", "Arial Black", sans-serif`;
    ctx.textBaseline = 'alphabetic';
    const chars = text.split('').map(ch => ({ ch, w: ctx.measureText(ch).width, isSpace: ch === ' ' }));
    const totalWidth = chars.reduce((s, c) => s + c.w, 0);
    let x = centerX - totalWidth / 2;
    let ci = 0;
    for (const { ch, w, isSpace } of chars) {
      if (!isSpace) {
        const color = TITLE_COLORS[ci++ % TITLE_COLORS.length];
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

  private roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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
