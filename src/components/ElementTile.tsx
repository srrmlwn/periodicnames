import React, { useState, useEffect } from 'react';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';

interface ElementTileProps {
  element?: Element;
  fakeElement?: FakeElement;
  isHighlighted?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
  animationDelay?: number;
}

const ElementTile: React.FC<ElementTileProps> = ({ 
  element, 
  fakeElement, 
  isHighlighted = false, 
  isExpanded = false,
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
      alkali: 'bg-red-100 border-red-200',
      alkaline: 'bg-orange-100 border-orange-200',
      transition: 'bg-yellow-100 border-yellow-200',
      postTransition: 'bg-green-100 border-green-200',
      metalloid: 'bg-blue-100 border-blue-200',
      nonmetal: 'bg-purple-100 border-purple-200',
      noble: 'bg-pink-100 border-pink-200',
      lanthanide: 'bg-indigo-100 border-indigo-200',
      actinide: 'bg-gray-100 border-gray-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 border-gray-200';
  };

  const getGlowColor = (category: string) => {
    const glowColors = {
      alkali: 'shadow-red-400/50',
      alkaline: 'shadow-orange-400/50',
      transition: 'shadow-yellow-400/50',
      postTransition: 'shadow-green-400/50',
      metalloid: 'shadow-blue-400/50',
      nonmetal: 'shadow-purple-400/50',
      noble: 'shadow-pink-400/50',
      lanthanide: 'shadow-indigo-400/50',
      actinide: 'shadow-gray-400/50',
    };
    return glowColors[category as keyof typeof glowColors] || 'shadow-gray-400/50';
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
      hover:scale-150 transition-all duration-200 ease-out
    `
    : `
      hover:shadow-lg hover:z-30 active:scale-95 
      group-hover:ring-1 group-hover:ring-blue-300 group-hover:ring-opacity-30 
      hover:scale-150 transition-all duration-200 ease-out
    `;

  const fakeClasses = isFake 
    ? 'bg-gray-200 border-dashed border-gray-400 text-gray-600' 
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
      <div className="absolute top-0 left-1 text-[6px] text-gray-600 font-normal">
        {element?.atomicNumber || '?'}
      </div>
      
      {/* Atomic weight in top right - show on hover or when highlighted */}
      {element?.atomicMass && (
        <div className={`absolute top-0 right-1 text-[6px] text-gray-500 font-normal transition-opacity duration-300 ${
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
        <div className={`absolute inset-0 rounded-lg border-2 border-current opacity-20 element-glow`} 
             style={{ animationDelay: `${animationDelay + 100}ms` }} />
      )}
      
      {/* Additional pulse effect for active matches */}
      {isHighlighted && showPulse && (
        <div className={`absolute inset-0 rounded-lg bg-current opacity-10 element-glow-pulse`} 
             style={{ animationDelay: `${animationDelay + 300}ms` }} />
      )}
    </div>
  );
};

export default ElementTile; 