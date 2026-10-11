import React, { useEffect, useState } from 'react';
import { SHIRT_COLORS, SHIRT_SIZES } from '../data/printProducts';
import type { ShirtColor, ShirtSize } from '../data/printProducts';
import { PLACEMENTS } from '../utils/printLayout';
import type { CaptionPosition, Placement } from '../utils/printLayout';

interface ShirtOptionsProps {
  color: ShirtColor;
  size: ShirtSize | null;
  placement: Placement;
  caption: string;
  captionPosition: CaptionPosition;
  captionOpen: boolean;
  onColor: (color: ShirtColor) => void;
  onSize: (size: ShirtSize) => void;
  onPlacement: (placement: Placement) => void;
  onCaption: (caption: string) => void;
  onCaptionPosition: (position: CaptionPosition) => void;
  onOpenCaption: () => void;
}

const CAPTION_MAX = 32;

const CAPTION_EXAMPLES = [
  'Born to be periodic',
  'Elementally yours',
  'Made of stardust',
  'Periodic and proud',
  'The element of surprise',
  'My name is science',
];

const EXAMPLE_INTERVAL_MS = 2500;

const CAPTION_POSITIONS: CaptionPosition[] = ['above', 'below'];

const chipClass = (active: boolean) =>
  `nb-focus min-w-[3.25rem] px-3 py-2 rounded-lg border-[3px] border-ink font-bold text-sm shadow-brutal-sm transition-colors ${
    active ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-mist'
  }`;

const ShirtOptions: React.FC<ShirtOptionsProps> = ({
  color, size, placement, caption, captionPosition, captionOpen,
  onColor, onSize, onPlacement, onCaption, onCaptionPosition, onOpenCaption,
}) => {
  const [exampleIdx, setExampleIdx] = useState(0);
  const showingExamples = caption.length === 0;

  useEffect(() => {
    if (!showingExamples) return;
    const id = setInterval(() => setExampleIdx(i => (i + 1) % CAPTION_EXAMPLES.length), EXAMPLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [showingExamples]);

  const example = CAPTION_EXAMPLES[exampleIdx];

  return (
  <div className="flex flex-col gap-4">
    <fieldset>
      <legend className="nb-label flex w-full justify-between">
        Colour <span className="normal-case tracking-normal font-semibold text-muted">{color.name}</span>
      </legend>
      <div className="flex gap-3">
        {SHIRT_COLORS.map(c => (
          <button
            key={c.name}
            type="button"
            onClick={() => onColor(c)}
            aria-label={c.name}
            aria-pressed={c.name === color.name}
            className={`nb-focus w-9 h-9 rounded-full border-[3px] border-ink ${c.name === color.name ? 'ring-[3px] ring-pop-sky ring-offset-2' : ''}`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
    </fieldset>

    <fieldset>
      <legend className="nb-label">Size</legend>
      <div className="flex flex-wrap gap-2">
        {SHIRT_SIZES.map(s => (
          <button key={s} type="button" onClick={() => onSize(s)} aria-pressed={s === size} className={chipClass(s === size)}>
            {s}
          </button>
        ))}
      </div>
    </fieldset>

    <fieldset>
      <legend className="nb-label">Placement</legend>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PLACEMENTS) as Placement[]).map(p => (
          <button key={p} type="button" onClick={() => onPlacement(p)} aria-pressed={p === placement} className={chipClass(p === placement)}>
            {PLACEMENTS[p].label}
          </button>
        ))}
      </div>
    </fieldset>

    {captionOpen ? (
      <div className="flex flex-col gap-2">
        <label className="block">
          <span className="nb-label">Line of text (optional)</span>
          <input
            autoFocus
            className="nb-input"
            value={caption}
            maxLength={CAPTION_MAX}
            placeholder={`e.g. ${example}`}
            onChange={e => onCaption(e.target.value)}
          />
        </label>
        {caption.trim() && (
          <div className="flex items-center gap-2" role="group" aria-label="Text position">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Text</span>
            {CAPTION_POSITIONS.map(p => (
              <button key={p} type="button" onClick={() => onCaptionPosition(p)} aria-pressed={p === captionPosition} className={chipClass(p === captionPosition)}>
                {p === 'above' ? 'Above name' : 'Below name'}
              </button>
            ))}
          </div>
        )}
      </div>
    ) : (
      <button
        type="button"
        onClick={onOpenCaption}
        className="nb-focus w-full truncate text-left rounded-lg border-2 border-dashed border-muted px-3 py-2.5 text-sm font-semibold text-muted hover:border-ink hover:text-ink"
      >
        + Add a line of text <span className="font-medium">· e.g. “{example}”</span>
      </button>
    )}
  </div>
  );
};

export default ShirtOptions;
