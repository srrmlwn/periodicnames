import React from 'react';
import ElementTile from './ElementTile';
import { matchNameToElements } from '../utils/elementMatcher';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';
import { LOGO_PALETTE } from '../utils/colorSchemes';

type AnyElement = Element | FakeElement;

const TITLE_RESULT = matchNameToElements('Periodic Names');

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

const Header: React.FC = () => {
  let tileIndex = 0;
  return (
    <header className="text-center py-3">
      <a href="/" aria-label="Periodic Names home" className="inline-flex flex-wrap justify-center gap-x-4 gap-y-2.5 mb-4">
        {WORDS.map((word, wi) => (
          <div key={wi} className="flex gap-1.5">
            {word.map((el, ei) => {
              const isFake = !('atomicNumber' in el);
              const i = tileIndex++;
              return (
                <div key={`${wi}-${ei}`} className="w-9 h-9 sm:w-11 sm:h-11">
                  <ElementTile
                    element={isFake ? undefined : el as Element}
                    fakeElement={isFake ? el as FakeElement : undefined}
                    animationDelay={i * 60}
                    colorOverride={LOGO_PALETTE[i % LOGO_PALETTE.length]}
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
        ))}
      </a>
      <p className="text-sm sm:text-base font-bold text-ink">
        Spell your name with the{' '}
        <span className="inline-block bg-pop-yellow border-2 border-ink px-1.5 -rotate-1">periodic table</span>
      </p>
    </header>
  );
};

export default Header;
