import React, { useState, useEffect } from 'react';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';
import { getCategoryColor, getFakeElementColor, getFakeElementBorderColor } from '../utils/colorSchemes';

interface ElementTileProps {
  element?: Element;
  fakeElement?: FakeElement;
  isHighlighted?: boolean;
  onClick?: () => void;
  animationDelay?: number;
  size?: 'xs' | 'sm' | 'lg';
}

const ElementTile: React.FC<ElementTileProps> = ({
  element,
  fakeElement,
  isHighlighted = false,
  onClick,
  animationDelay = 0,
  size = 'sm'
}) => {
  const isFake = !!fakeElement;
  const displayElement = element || fakeElement;

  const [showPulse, setShowPulse] = useState(false);
  const [hasWobbled, setHasWobbled] = useState(false);

  useEffect(() => {
    if (isHighlighted) {
      setTimeout(() => setShowPulse(true), animationDelay + 200);
    } else {
      setShowPulse(false);
    }
  }, [isHighlighted, animationDelay]);

  if (!displayElement) return null;

  const fakeAtomicNumber = isFake
    ? [...fakeElement!.name].reduce((sum, c) => sum + c.charCodeAt(0), 0)
    : undefined;

  const baseClasses = `
    w-full h-full rounded-md border-2 shadow-sm
    flex flex-col items-center justify-center
    cursor-pointer font-bold relative overflow-hidden
    transition-all duration-300 ease-out hover-lift
  `;

  const animationClasses = isHighlighted
    ? `
      z-20 scale-125 element-highlighted
      ${showPulse ? 'element-pulse' : ''}
      hover:scale-135 hover:z-30 active:scale-95
      transition-all duration-300 ease-out
    `
    : `
      hover:shadow-lg hover:z-30 active:scale-95
      hover:scale-125 transition-all duration-300 ease-out
    `;

  const fakeClasses = isFake
    ? `text-amber-200 ${!hasWobbled ? 'fake-wobble' : ''}`
    : 'text-white';

  const classes = `${baseClasses} ${fakeClasses} ${animationClasses}`;

  const backgroundColor = isFake ? getFakeElementColor() : getCategoryColor(element?.category || '');
  const borderColor = isFake ? getFakeElementBorderColor() : '#111111';

  const atomicNumberClass = size === 'lg' ? 'text-xs' : 'text-[5px]';
  const symbolClass = size === 'lg' ? 'text-2xl font-black' : size === 'xs' ? 'text-[9px] font-bold' : 'text-sm font-bold';
  const nameClass = size === 'lg' ? 'text-[8px]' : 'text-[6px]';

  const displayAtomicNumber = fakeAtomicNumber ?? element?.atomicNumber;

  return (
    <div
      className={`${classes} group`}
      onClick={onClick}
      title={`${displayElement.name} (${displayElement.symbol})`}
      onAnimationEnd={(e) => {
        if (e.animationName === 'fakeWobble') setHasWobbled(true);
      }}
      style={{
        backgroundColor,
        borderColor,
        animationDelay: `${animationDelay}ms`,
        transitionDelay: `${animationDelay}ms`
      }}
    >
      {size !== 'xs' && (
        <div className={`absolute top-0 left-0.5 ${atomicNumberClass} text-white/80 font-normal`}>
          {displayAtomicNumber}
        </div>
      )}

      <div className={`${symbolClass} leading-none relative`}>
        {displayElement.symbol}
        {isFake && <sup className="absolute -top-1 -right-2 text-[0.5em] font-bold text-amber-300">*</sup>}
      </div>

      {size !== 'xs' && (
        <div className={`absolute bottom-0.5 left-0.5 right-0.5 ${nameClass} text-center leading-tight font-normal transition-all duration-300 ${
          isHighlighted ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
        }`}>
          <span className="block truncate">
            {displayElement.name}
          </span>
        </div>
      )}

      {isHighlighted && showPulse && (
        <div className="absolute inset-0 rounded-md bg-white opacity-20 element-glow-pulse"
          style={{ animationDelay: `${animationDelay + 300}ms` }} />
      )}
    </div>
  );
};

export default ElementTile;
