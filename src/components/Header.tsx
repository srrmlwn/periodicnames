import React from 'react';
import { matchNameToElements } from '../utils/elementMatcher';
import { getCategoryColor, getCategoryBorderColor, getFakeElementColor, getFakeElementBorderColor } from '../utils/colorSchemes';

type AnyElement = ReturnType<typeof matchNameToElements>['orderedElements'][number];

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

function getAtomicNumber(el: AnyElement): number | string {
  if ('atomicNumber' in el) return el.atomicNumber;
  return [...el.name].reduce((sum, c) => sum + c.charCodeAt(0), 0);
}

const Header: React.FC = () => (
  <header className="text-center py-3">
    <div className="flex flex-col items-center gap-1 mb-2">
      {WORDS.map((word, wi) => (
        <div key={wi} className="flex gap-0.5">
          {word.map((el, ei) => {
            const isFake = !('atomicNumber' in el);
            const bgColor = isFake ? getFakeElementColor() : getCategoryColor('category' in el ? el.category : '');
            const borderColor = isFake ? getFakeElementBorderColor() : getCategoryBorderColor('category' in el ? el.category : '');
            const textClass = isFake ? 'text-amber-200' : 'text-white';
            const numClass = isFake ? 'text-amber-300' : 'text-white/80';
            return (
              <div
                key={`${wi}-${ei}`}
                className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded border-2 flex items-center justify-center ${textClass}`}
                style={{ backgroundColor: bgColor, borderColor }}
                title={el.name}
              >
                <span className={`absolute top-0 left-0.5 text-[5px] sm:text-[6px] font-normal leading-none ${numClass}`}>
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

export default Header;
