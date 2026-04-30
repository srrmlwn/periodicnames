import React, { useRef, useState } from 'react';
import type { NameResult } from '../types';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';
import { getCategoryColor, getFakeElementColor, getFakeElementBorderColor } from '../utils/colorSchemes';

interface Offset { x: number; y: number }

interface DesignCanvasProps {
  result: NameResult;
  customText: string;
  onTilesOffsetChange: (o: Offset) => void;
  onCaptionOffsetChange: (o: Offset) => void;
}

const PREVIEW = 340;
const PRINT = 4500;
const TO_PRINT = PRINT / PREVIEW;
const PAD = 18;

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

  for (let sz = 44; sz >= 18; sz -= 2) {
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

  return { rows: [words], sz: 18, gap: 2, wgap: 4, rgap: 3 };
}

const DesignCanvas: React.FC<DesignCanvasProps> = ({ result, customText, onTilesOffsetChange, onCaptionOffsetChange }) => {
  const [tilesOff, setTilesOff] = useState<Offset>({ x: 0, y: 0 });
  const [captionOff, setCaptionOff] = useState<Offset>({ x: 0, y: 0 });
  const dragging = useRef<'tiles' | 'caption' | null>(null);
  const dragStart = useRef({ px: 0, py: 0, bx: 0, by: 0 });

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
  const captFontPx = Math.max(10, Math.min(15, sz * 0.36));
  const hasCaption = !!customText;

  const half = PREVIEW / 2 - PAD;

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
  // Caption defaults below tile group; captionOff is a delta from there
  const captTop = cy + tilesOff.y + tilesH / 2 + captGap + captionOff.y;

  return (
    <div>
      <div
        className="relative bg-white rounded-xl border-2 border-gray-100 overflow-hidden select-none mx-auto"
        style={{ width: PREVIEW, height: PREVIEW }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
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
                    return (
                      <React.Fragment key={`${ti}-${el.symbol}`}>
                        {ti > 0 && <div style={{ width: gap, flexShrink: 0 }} />}
                        <div
                          style={{
                            width: sz,
                            height: sz,
                            backgroundColor: bg,
                            border: `${Math.max(1, Math.round(sz * 0.045))}px solid ${border}`,
                            borderRadius: sz * 0.12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span style={{
                            fontSize: sz * 0.4,
                            fontWeight: 900,
                            fontFamily: '"Nunito", sans-serif',
                            color: isFake ? '#fde68a' : 'white',
                            lineHeight: 1,
                            pointerEvents: 'none',
                          }}>
                            {el.symbol}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>

        {/* Caption — drag handle */}
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

        {/* Drag hint overlay (fades once the user drags) */}
        {tilesOff.x === 0 && tilesOff.y === 0 && captionOff.x === 0 && captionOff.y === 0 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
            <span className="text-[10px] text-gray-300 font-medium">drag to reposition</span>
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
