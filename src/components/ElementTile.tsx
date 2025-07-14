import React, { useState, useEffect } from 'react';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';

interface ElementTileProps {
  element?: Element;
  fakeElement?: FakeElement;
  isHighlighted?: boolean;
  onClick?: () => void;
  animationDelay?: number;
}

const ElementTile: React.FC<ElementTileProps> = ({ 
  element, 
  fakeElement, 
  isHighlighted = false, 
  onClick,
  animationDelay = 0
}) => {
  const isFake = !!fakeElement;
  const displayElement = element || fakeElement;
  
  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  
  // Trigger animations when highlighting changes
  useEffect(() => {
    if (isHighlighted) {
      setIsAnimating(true);
      // Stagger the glow effect
      setTimeout(() => setShowGlow(true), animationDelay);
      // Add pulse effect after glow
      setTimeout(() => setShowPulse(true), animationDelay + 200);
    } else {
      setShowGlow(false);
      setShowPulse(false);
      setIsAnimating(false);
    }
  }, [isHighlighted, animationDelay]);
  
  if (!displayElement) return null;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      alkali: 'bg-red-500 border-red-600 text-white',
      alkaline: 'bg-orange-500 border-orange-600 text-white',
      transition: 'bg-blue-500 border-blue-600 text-white',
      postTransition: 'bg-emerald-500 border-emerald-600 text-white',
      metalloid: 'bg-purple-500 border-purple-600 text-white',
      nonmetal: 'bg-cyan-500 border-cyan-600 text-white',
      noble: 'bg-pink-500 border-pink-600 text-white',
      lanthanide: 'bg-indigo-500 border-indigo-600 text-white',
      actinide: 'bg-slate-500 border-slate-600 text-white',
    };
    return colors[category as keyof typeof colors] || 'bg-slate-500 border-slate-600 text-white';
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
    w-14 h-14 rounded-lg border-2 shadow-sm
    flex flex-col items-center justify-center
    cursor-pointer font-bold text-sm relative overflow-hidden
    transition-all duration-300 ease-out hover-lift
  `;

  // Enhanced animation classes with custom CSS animations
  const animationClasses = isHighlighted
    ? `
      z-20 shadow-xl
      ${showGlow ? getGlowColor(element?.category || '') : ''}
      ${showPulse ? 'element-pulse' : ''}
      ${isAnimating ? 'element-fade-in' : ''}
      hover:shadow-lg hover:z-30 active:scale-95 
      group-hover:ring-1 group-hover:ring-blue-300 group-hover:ring-opacity-30 
      hover:scale-150 transition-all duration-300 ease-out
    `
    : `
      hover:shadow-lg hover:z-30 active:scale-95 
      group-hover:ring-1 group-hover:ring-blue-300 group-hover:ring-opacity-30 
      hover:scale-150 transition-all duration-300 ease-out
    `;

  const fakeClasses = isFake 
    ? 'bg-amber-400 border-dashed border-amber-500 text-amber-900' 
    : getCategoryColor(element?.category || '');

  const classes = `${baseClasses} ${fakeClasses} ${animationClasses}`;

  return (
    <div 
      className={`${classes} group`}
      onClick={handleClick}
      title={`${displayElement.name} (${displayElement.symbol})`}
      style={{
        animationDelay: `${animationDelay}ms`,
        transitionDelay: `${animationDelay}ms`
      }}
    >
      {/* Atomic number in top left */}
      <div className="absolute top-0 left-1 text-[6px] text-white/80 font-normal">
        {element?.atomicNumber || '?'}
      </div>
      
      {/* Atomic weight in top right - show on hover or when highlighted */}
      {element?.atomicMass && (
        <div className={`absolute top-0 right-1 text-[6px] text-white/70 font-normal transition-opacity duration-300 ${
          isHighlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {element.atomicMass}
        </div>
      )}
      
      {/* Element symbol in center */}
      <div className="text-lg font-bold">
        {displayElement.symbol}
      </div>
      
      {/* Element name at bottom - always truncated with ellipsis */}
      <div className={`absolute bottom-1 left-1 right-1 text-[10px] text-center leading-tight font-normal transition-all duration-300 ${
        isHighlighted ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
      }`}>
        <span className="block truncate">
          {displayElement.name}
        </span>
      </div>
      
      {/* Enhanced glow ring for highlighted elements */}
      {isHighlighted && showGlow && (
        <div className={`absolute inset-0 rounded-lg border-2 border-white opacity-60 element-glow`} 
             style={{ animationDelay: `${animationDelay + 100}ms` }} />
      )}
      
      {/* Additional pulse effect for active matches */}
      {isHighlighted && showPulse && (
        <div className={`absolute inset-0 rounded-lg bg-white opacity-20 element-glow-pulse`} 
             style={{ animationDelay: `${animationDelay + 300}ms` }} />
      )}
    </div>
  );
};

export default ElementTile; 