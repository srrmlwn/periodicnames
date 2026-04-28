import React from 'react';
import { matchNameToElements } from '../utils/elementMatcher';

type AnyElement = ReturnType<typeof matchNameToElements>['orderedElements'][number];

const TITLE_RESULT = matchNameToElements('Periodic Names');

const HEADER_PALETTE = [
  { bg: '#e03030', border: '#b91c1c' }, // red
  { bg: '#f97316', border: '#c2410c' }, // orange
  { bg: '#f59e0b', border: '#b45309' }, // amber
  { bg: '#16a34a', border: '#15803d' }, // green
  { bg: '#0891b2', border: '#0e7490' }, // cyan
  { bg: '#7c3aed', border: '#6d28d9' }, // purple
  { bg: '#db2777', border: '#be185d' }, // pink
];

function splitIntoWords(elements: AnyElement[]): AnyElement[][] {
  const words: AnyElement[][] = [];
  let current: AnyElement[] = [];
  for (const el of elements) {
    if (el.symbol === ' ') {
      if (current.length > 0) words.push(current);
      current = [];
    } else {
      current.push(el);
    }
  }
  if (current.length > 0) words.push(current);
  return words;
}

const WORDS = splitIntoWords(TITLE_RESULT.orderedElements);

function getAtomicNumber(el: AnyElement): number | string {
  if ('atomicNumber' in el) return el.atomicNumber;
  return [...el.name].reduce((sum, c) => sum + c.charCodeAt(0), 0);
}

const Header: React.FC = () => {
  let tileIndex = 0;
  return (
    <header className="text-center py-3">
      <div className="flex flex-col items-center gap-1 mb-2">
        {WORDS.map((word, wi) => (
          <div key={wi} className="flex gap-0.5">
            {word.map((el, ei) => {
              const { bg, border } = HEADER_PALETTE[tileIndex++ % HEADER_PALETTE.length];
              return (
                <div
                  key={`${wi}-${ei}`}
                  className="relative w-7 h-7 sm:w-8 sm:h-8 rounded border-2 flex items-center justify-center text-white"
                  style={{ backgroundColor: bg, borderColor: border }}
                  title={el.name}
                >
                  <span className="absolute top-0 left-0.5 text-[5px] sm:text-[6px] font-normal leading-none text-white/80">
                    {getAtomicNumber(el)}
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold leading-none">
                    {el.symbol}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-sm font-semibold text-gray-500">
        Find your name in the Periodic Table of Elements
      </p>
    </header>
  );
};

export default Header;
