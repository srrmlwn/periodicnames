import React from 'react';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';
import { getCategoryColor, getFakeElementColor, BRAND, NEW_RIBBON_LABEL } from '../utils/colorSchemes';
import { fakeAtomicNumber } from '../utils/canvasTile';

interface ElementTileProps {
  element?: Element;
  fakeElement?: FakeElement;
  animationDelay?: number;
  size?: 'xs' | 'sm' | 'lg';
  colorOverride?: string;
}

const ElementTile: React.FC<ElementTileProps> = ({
  element,
  fakeElement,
  animationDelay = 0,
  size = 'sm',
  colorOverride,
}) => {
  const isFake = !!fakeElement;
  const displayElement = element || fakeElement;
  if (!displayElement) return null;

  const atomicNumber = isFake ? fakeAtomicNumber(fakeElement!.name) : element?.atomicNumber;
  const backgroundColor = colorOverride ?? (isFake ? getFakeElementColor() : getCategoryColor(element?.category || ''));

  const symbolClass = size === 'lg' ? 'text-2xl sm:text-[1.75rem]' : size === 'xs' ? 'text-[10px]' : 'text-base sm:text-lg';
  const numberClass = size === 'lg' ? 'text-[9px] sm:text-[11px]' : 'text-[7px]';

  return (
    <div
      className={`w-full h-full rounded-md border-[3px] shadow-brutal flex flex-col items-center justify-center font-bold relative overflow-hidden transition-transform duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg ${
        isFake ? 'text-ink fake-wobble' : 'text-ink tile-pop'
      }`}
      title={`${displayElement.name} (${displayElement.symbol})${isFake ? ' — newly discovered' : ''}`}
      style={{ backgroundColor, borderColor: BRAND.ink, animationDelay: `${animationDelay}ms` }}
    >
      {isFake && size === 'lg' && (
        <span className="absolute top-[3px] -right-[15px] w-[46px] sm:top-[8px] sm:-right-[19px] sm:w-[64px] rotate-45 bg-ink text-white text-center font-bold tracking-wider leading-[1.4] text-[6px] sm:leading-[1.5] sm:text-[8px]">
          {NEW_RIBBON_LABEL}
        </span>
      )}
      {isFake && size === 'sm' && (
        <span className="absolute top-[3px] -right-[16px] w-[46px] sm:top-[4px] sm:-right-[17px] sm:w-[52px] rotate-45 bg-ink text-white text-center font-bold tracking-wide leading-[1.35] text-[5px] sm:text-[6px]">
          {NEW_RIBBON_LABEL}
        </span>
      )}
      {isFake && size === 'xs' && (
        <span className="absolute -top-[9px] -right-[9px] w-[18px] h-[18px] rotate-45 bg-ink" aria-hidden="true" />
      )}
      {size !== 'xs' && (
        <span className={`absolute top-0.5 left-1 leading-none opacity-75 ${numberClass}`}>
          {atomicNumber}
        </span>
      )}

      <div className={`${symbolClass} leading-none flex items-start tracking-tight`}>
        <span>{displayElement.symbol}</span>
      </div>

      {size === 'lg' && (
        <span className="absolute bottom-0.5 left-0.5 right-0.5 text-center leading-tight font-medium truncate text-[7px] sm:text-[9px]">
          {displayElement.name}
        </span>
      )}
    </div>
  );
};

export default ElementTile;
