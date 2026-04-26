import React, { useState, useEffect } from 'react';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';
import { getCategoryColor, getFakeElementBorderColor } from '../utils/colorSchemes';

interface ElementTileProps {
  element?: Element;
  fakeElement?: FakeElement;
  isHighlighted?: boolean;
  onClick?: () => void;
  animationDelay?: number;
  size?: 'sm' | 'lg';
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

  useEffect(() => {
    if (isFake) {
      requestAnimationFrame(() => {
        setHasWobbled(false);
      });
    }
  }, [isFake]);

  if (!displayElement) return null;

  const handleClick = () => {
    if (onClick) onClick();
  };

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
    ? `text-amber-900 fake-shimmer ${isFake && !hasWobbled ? 'fake-wobble' : ''}`
    : 'text-white';

  const classes = `${baseClasses} ${fakeClasses} ${animationClasses}`;

  const backgroundColor = isFake ? 'transparent' : getCategoryColor(element?.category || '');
  const borderColor = isFake ? getFakeElementBorderColor() : '#111111';

  const atomicNumberClass = size === 'lg' ? 'text-xs' : 'text-[5px]';
  const symbolClass = size === 'lg' ? 'text-2xl font-black' : 'text-sm font-bold';
  const nameClass = size === 'lg' ? 'text-[9px]' : 'text-[6px]';

  return (
    <div
      className={`${classes} group`}
      onClick={handleClick}
      title={`${displayElement.name} (${displayElement.symbol})`}
      style={{
        backgroundColor,
        borderColor,
        animationDelay: `${animationDelay}ms`,
        transitionDelay: `${animationDelay}ms`
      }}
    >
      <div className={`absolute top-0 left-0.5 ${atomicNumberClass} text-white/80 font-normal`}>
        {element?.atomicNumber || '?'}
      </div>

      {element?.atomicMass && (
        <div className={`absolute top-0 right-0.5 ${atomicNumberClass} text-white/70 font-normal transition-opacity duration-300 ${
          isHighlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {element.atomicMass}
        </div>
      )}

      <div className={`${symbolClass} leading-none`}>
        {displayElement.symbol}
      </div>

      <div className={`absolute bottom-0.5 left-0.5 right-0.5 ${nameClass} text-center leading-tight font-normal transition-all duration-300 ${
        isHighlighted ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
      }`}>
        <span className="block truncate">
          {displayElement.name}
        </span>
      </div>

      {isHighlighted && showPulse && (
        <div className="absolute inset-0 rounded-md bg-white opacity-20 element-glow-pulse"
          style={{ animationDelay: `${animationDelay + 300}ms` }} />
      )}
    </div>
  );
};

export default ElementTile;
