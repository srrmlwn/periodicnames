import React, { useRef, useState, useEffect } from 'react';
import type { NameResult } from '../types';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';
import { getAllElements } from '../data/elements';
import { getCategoryColor, getFakeElementColor, getFakeElementBorderColor } from '../utils/colorSchemes';
import { ELEMENT_POSITIONS } from '../utils/PrintDesignGenerator';

interface Offset { x: number; y: number }

interface DesignCanvasProps {
  result: NameResult;
  customText: string;
  showWatermark: boolean;
  initialTilesOff?: Offset;
  initialCaptionOff?: Offset;
  onTilesOffsetChange: (o: Offset) => void;
  onCaptionOffsetChange: (o: Offset) => void;
}

const PREVIEW = 280;
const PRINT = 4500;
const TO_PRINT = PRINT / PREVIEW;
const PAD = 16;

type Word = (Element | FakeElement)[];

interface PreviewLayout {
  rows: Word[][];
  sz: number;
  gap: number;
  wgap: number;
  rgap: number;
}

function buildRows(result: NameResult, available: number): PreviewLayout {
  const words: Word[] = [];
  let cur: Word = [];
  for (const el of result.orderedElements) {
    if (el.symbol === ' ') {
      if (cur.length > 0) { words.push(cur); cur = []; }
    } else {
      cur.push(el as Element | FakeElement);
    }
  }
  if (cur.length > 0) words.push(cur);

  const maxLen = Math.max(1, ...words.map(w => w.length));

  for (let sz = 56; sz >= 20; sz -= 2) {
    const gap = Math.round(sz * 0.1);
    const wgap = Math.round(sz * 0.22);
    const rgap = Math.round(sz * 0.18);
    if (maxLen * sz + Math.max(0, maxLen - 1) * gap > available) continue;

    const rows: Word[][] = [];
    let row: Word[] = [];
    let rw = 0;
    for (const word of words) {
      const ww = word.length * sz + Math.max(0, word.length - 1) * gap;
      const added = (row.length > 0 ? wgap : 0) + ww;
      if (rw + added > available && row.length > 0) {
        rows.push(row); row = [word]; rw = ww;
      } else {
        row.push(word); rw += added;
      }
    }
    if (row.length > 0) rows.push(row);

    const totalH = rows.length * sz + Math.max(0, rows.length - 1) * rgap;
    if (totalH <= available) return { rows, sz, gap, wgap, rgap };
  }

  return { rows: [words], sz: 20, gap: 2, wgap: 4, rgap: 3 };
}

function drawWatermark(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = PREVIEW;
  ctx.clearRect(0, 0, size, size);
  const categoryMap = new Map(getAllElements().map(e => [e.symbol, e.category]));
  const cellSize = size / 18;
  const tableHeight = 9.5 * cellSize;
  const tableStartY = (size - tableHeight) / 2;
  const pad = cellSize * 0.06;
  ctx.globalAlpha = 0.12;
  for (const [symbol, row, col] of ELEMENT_POSITIONS) {
    const category = categoryMap.get(symbol);
    if (!category) continue;
    const x = col * cellSize;
    const y = tableStartY + (row <= 6 ? row : row + 0.5) * cellSize;
    ctx.fillStyle = getCategoryColor(category);
    ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
  }
  ctx.globalAlpha = 1;
}

const DesignCanvas: React.FC<DesignCanvasProps> = ({
  result,
  customText,
  showWatermark,
  initialTilesOff,
  initialCaptionOff,
  onTilesOffsetChange,
  onCaptionOffsetChange,
}) => {
  const [tilesOff, setTilesOff] = useState<Offset>(initialTilesOff ?? { x: 0, y: 0 });
  const [captionOff, setCaptionOff] = useState<Offset>(initialCaptionOff ?? { x: 0, y: 0 });
  const dragging = useRef<'tiles' | 'caption' | null>(null);
  const dragStart = useRef({ px: 0, py: 0, bx: 0, by: 0 });
  const watermarkRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (watermarkRef.current) drawWatermark(watermarkRef.current);
  }, []);

  const { rows, sz, gap, wgap, rgap } = buildRows(result, PREVIEW - PAD * 2);

  const tilesH = rows.length * sz + Math.max(0, rows.length - 1) * rgap;
  const maxRowW = rows.reduce((m, row) => {
    let rw = 0;
    row.forEach((word, wi) => {
      if (wi > 0) rw += wgap;
      rw += word.length * sz + Math.max(0, word.length - 1) * gap;
    });
    return Math.max(m, rw);
  }, 0);

  const captGap = Math.round(sz * 0.4);
  const captFontPx = Math.max(11, Math.min(16, sz * 0.36));
  const hasCaption = !!customText;
  const half = PREVIEW / 2 - PAD;
  const showDetail = sz >= 28;

  const onTileDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = 'tiles';
    dragStart.current = { px: e.clientX, py: e.clientY, bx: tilesOff.x, by: tilesOff.y };
  };

  const onCaptionDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = 'caption';
    dragStart.current = { px: e.clientX, py: e.clientY, bx: captionOff.x, by: captionOff.y };
  };

  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.px;
    const dy = e.clientY - dragStart.current.py;
    const x = Math.max(-half, Math.min(half, dragStart.current.bx + dx));
    const y = Math.max(-half, Math.min(half, dragStart.current.by + dy));
    if (dragging.current === 'tiles') {
      setTilesOff({ x, y });
      onTilesOffsetChange({ x: x * TO_PRINT, y: y * TO_PRINT });
    } else {
      setCaptionOff({ x, y });
      onCaptionOffsetChange({ x: x * TO_PRINT, y: y * TO_PRINT });
    }
  };

  const onUp = () => { dragging.current = null; };

  const reset = () => {
    setTilesOff({ x: 0, y: 0 });
    setCaptionOff({ x: 0, y: 0 });
    onTilesOffsetChange({ x: 0, y: 0 });
    onCaptionOffsetChange({ x: 0, y: 0 });
  };

  const cx = PREVIEW / 2;
  const cy = PREVIEW / 2;
  const tileLeft = cx + tilesOff.x;
  const tileTop = cy + tilesOff.y - tilesH / 2;
  const captLeft = cx + captionOff.x;
  // Caption defaults ABOVE tile group
  const captTop = cy + tilesOff.y - tilesH / 2 - captGap - captFontPx + captionOff.y;
  const hasMoved = tilesOff.x !== 0 || tilesOff.y !== 0 || captionOff.x !== 0 || captionOff.y !== 0;

  return (
    <div>
      <div
        className="relative rounded-xl border-2 border-gray-100 overflow-hidden select-none mx-auto"
        style={{ width: PREVIEW, height: PREVIEW, backgroundColor: '#ffffff' }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* Watermark canvas layer */}
        <canvas
          ref={watermarkRef}
          width={PREVIEW}
          height={PREVIEW}
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{ opacity: showWatermark ? 1 : 0 }}
        />

        {/* Tile group — drag handle */}
        <div
          className="absolute cursor-grab active:cursor-grabbing"
          style={{ left: tileLeft, top: tileTop, width: maxRowW, transform: 'translateX(-50%)' }}
          onPointerDown={onTileDown}
        >
          {rows.map((row, ri) => (
            <div
              key={ri}
              className="flex justify-center"
              style={{ marginBottom: ri < rows.length - 1 ? rgap : 0 }}
            >
              {row.map((word, wi) => (
                <React.Fragment key={wi}>
                  {wi > 0 && <div style={{ width: wgap, flexShrink: 0 }} />}
                  {word.map((el, ti) => {
                    const isFake = !('atomicNumber' in el);
                    const bg = isFake ? getFakeElementColor() : getCategoryColor((el as Element).category);
                    const border = isFake ? getFakeElementBorderColor() : '#111111';
                    const fakeAtomicNum = isFake
                      ? [...el.name].reduce((s, c) => s + c.charCodeAt(0), 0)
                      : null;
                    const atomicNum = isFake ? fakeAtomicNum : (el as Element).atomicNumber;

                    return (
                      <React.Fragment key={`${el.symbol}-${ti}`}>
                        {ti > 0 && <div style={{ width: gap, flexShrink: 0 }} />}
                        <div
                          style={{
                            width: sz,
                            height: sz,
                            backgroundColor: bg,
                            border: `${Math.max(1, Math.round(sz * 0.045))}px solid ${border}`,
                            borderRadius: sz * 0.12,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                          }}
                        >
                          {/* Atomic number */}
                          {showDetail && (
                            <span style={{
                              position: 'absolute',
                              top: sz * 0.04,
                              left: sz * 0.07,
                              fontSize: Math.max(5, sz * 0.16),
                              fontWeight: 700,
                              fontFamily: '"Nunito", sans-serif',
                              color: isFake ? 'rgba(253,230,138,0.85)' : 'rgba(255,255,255,0.82)',
                              lineHeight: 1,
                              pointerEvents: 'none',
                            }}>
                              {atomicNum}
                            </span>
                          )}

                          {/* Symbol */}
                          <span style={{
                            fontSize: sz * 0.38,
                            fontWeight: 900,
                            fontFamily: '"Nunito", sans-serif',
                            color: isFake ? '#fde68a' : 'white',
                            lineHeight: 1,
                            pointerEvents: 'none',
                            marginTop: showDetail ? sz * 0.06 : 0,
                          }}>
                            {el.symbol}
                          </span>

                          {/* Fake star */}
                          {isFake && showDetail && (
                            <span style={{
                              position: 'absolute',
                              top: sz * 0.04,
                              left: sz * 0.55,
                              fontSize: sz * 0.14,
                              fontWeight: 900,
                              fontFamily: '"Nunito", sans-serif',
                              color: '#fcd34d',
                              lineHeight: 1,
                              pointerEvents: 'none',
                            }}>*</span>
                          )}

                          {/* Element name */}
                          {showDetail && (
                            <span style={{
                              position: 'absolute',
                              bottom: sz * 0.04,
                              left: 0,
                              right: 0,
                              fontSize: Math.max(5, sz * 0.14),
                              fontFamily: '"Nunito", sans-serif',
                              color: isFake ? 'rgba(253,230,138,0.85)' : 'rgba(255,255,255,0.88)',
                              textAlign: 'center',
                              lineHeight: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              padding: '0 2px',
                              pointerEvents: 'none',
                            }}>
                              {el.name}
                            </span>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          ))}

          {/* Brand text — anchored to bottom-right of tile group, moves with tiles */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: tilesH + Math.round(sz * 0.12),
              fontSize: Math.max(5, Math.round(sz * 0.13)),
              fontFamily: '"Nunito", sans-serif',
              color: 'rgba(150,150,150,0.6)',
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            periodicnames.com
          </div>
        </div>

        {/* Caption drag handle */}
        {hasCaption && (
          <div
            className="absolute cursor-grab active:cursor-grabbing font-semibold"
            style={{
              left: captLeft,
              top: captTop,
              transform: 'translateX(-50%)',
              fontSize: captFontPx,
              fontFamily: '"Nunito", sans-serif',
              color: '#1e293b',
              whiteSpace: 'nowrap',
              maxWidth: PREVIEW - PAD * 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}
            onPointerDown={onCaptionDown}
          >
            {customText}
          </div>
        )}

        {/* Hint — fades once user drags */}
        {!hasMoved && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
            <span className="text-[10px] text-gray-300 font-medium tracking-wide">drag to reposition</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={reset}
        className="mt-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors duration-150"
      >
        Reset layout
      </button>
    </div>
  );
};

export default DesignCanvas;
