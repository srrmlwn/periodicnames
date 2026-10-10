import React from 'react';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';
import { getCategoryColor, getFakeElementColor, getFakeElementBorderColor, BRAND } from '../utils/colorSchemes';
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
  const backgroundColor = isFake ? getFakeElementColor() : colorOverride ?? getCategoryColor(element?.category || '');
  const borderColor = isFake ? getFakeElementBorderColor() : BRAND.ink;

  const symbolClass = size === 'lg' ? 'text-2xl sm:text-[1.75rem]' : size === 'xs' ? 'text-[10px]' : 'text-base sm:text-lg';
  const numberClass = size === 'lg' ? 'text-[9px] sm:text-[11px]' : 'text-[7px]';

  return (
    <div
      className={`w-full h-full rounded-md border-[3px] shadow-brutal flex flex-col items-center justify-center font-bold relative overflow-hidden transition-transform duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg ${
        isFake ? 'text-pop-yellow fake-wobble' : 'text-ink tile-pop'
      }`}
      title={`${displayElement.name} (${displayElement.symbol})${isFake ? ' — fictional' : ''}`}
      style={{ backgroundColor, borderColor, animationDelay: `${animationDelay}ms` }}
    >
      {size !== 'xs' && (
        <span className={`absolute top-0.5 left-1 leading-none opacity-75 ${numberClass}`}>
          {atomicNumber}
        </span>
      )}

      <div className={`${symbolClass} leading-none flex items-start tracking-tight`}>
        <span>{displayElement.symbol}</span>
        {isFake && <span className="text-[0.5em]">*</span>}
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
