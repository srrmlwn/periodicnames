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

  const [isAnimating, setIsAnimating] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [hasWobbled, setHasWobbled] = useState(false);

  useEffect(() => {
    if (isHighlighted) {
      setIsAnimating(true);
      setTimeout(() => setShowGlow(true), animationDelay);
      setTimeout(() => setShowPulse(true), animationDelay + 200);
    } else {
      setShowGlow(false);
      setShowPulse(false);
      setIsAnimating(false);
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

  const getGlowColor = (category: string) => {
    const glowColors = {
      alkali: 'shadow-red-400/80',
      alkaline: 'shadow-orange-400/80',
      transition: 'shadow-blue-400/80',
      postTransition: 'shadow-emerald-400/80',
      metalloid: 'shadow-purple-400/80',
      nonmetal: 'shadow-cyan-400/80',
      noble: 'shadow-pink-400/80',
      lanthanide: 'shadow-indigo-400/80',
      actinide: 'shadow-slate-400/80',
    };
    return glowColors[category as keyof typeof glowColors] || 'shadow-slate-400/80';
  };

  const baseClasses = `
    w-full h-full rounded-md border-2 shadow-sm
    flex flex-col items-center justify-center
    cursor-pointer font-bold relative overflow-hidden
    transition-all duration-300 ease-out hover-lift
  `;

  const animationClasses = isHighlighted
    ? `
      z-20 shadow-xl
      ${showGlow ? getGlowColor(element?.category || '') : ''}
      ${showPulse ? 'element-pulse' : ''}
      ${isAnimating ? 'element-fade-in' : ''}
      hover:shadow-lg hover:z-30 active:scale-95
      group-hover:ring-1 group-hover:ring-blue-300 group-hover:ring-opacity-30
      hover:scale-125 transition-all duration-300 ease-out
    `
    : `
      hover:shadow-lg hover:z-30 active:scale-95
      group-hover:ring-1 group-hover:ring-blue-300 group-hover:ring-opacity-30
      hover:scale-125 transition-all duration-300 ease-out
    `;

  const fakeClasses = isFake
    ? `border-dashed text-amber-900 fake-shimmer ${isFake && !hasWobbled ? 'fake-wobble' : ''}`
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

      {isHighlighted && showGlow && (
        <div className="absolute inset-0 rounded-md border border-white opacity-60 element-glow"
          style={{ animationDelay: `${animationDelay + 100}ms` }} />
      )}

      {isHighlighted && showPulse && (
        <div className="absolute inset-0 rounded-md bg-white opacity-20 element-glow-pulse"
          style={{ animationDelay: `${animationDelay + 300}ms` }} />
      )}
    </div>
  );
};

export default ElementTile;
