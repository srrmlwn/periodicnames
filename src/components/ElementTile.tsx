import React, { useState } from 'react';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';

interface ElementTileProps {
  element?: Element;
  fakeElement?: FakeElement;
  isHighlighted?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
}

const ElementTile: React.FC<ElementTileProps> = ({ 
  element, 
  fakeElement, 
  isHighlighted = false, 
  isExpanded = false,
  onClick 
}) => {
  const isFake = !!fakeElement;
  const displayElement = element || fakeElement;
  
  if (!displayElement) return null;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const isExpandedState = isExpanded;

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

  const baseClasses = `
    w-14 h-14 rounded-lg border-2 shadow-sm
    flex flex-col items-center justify-center
    cursor-pointer transition-all duration-300 ease-in-out
    font-bold text-sm relative overflow-hidden
  `;

  const highlightClasses = isHighlighted
    ? 'ring-4 ring-blue-400 ring-opacity-50 shadow-lg z-10 scale-150' 
    : 'hover:shadow-lg hover:z-10 active:scale-95 group-hover:ring-2 group-hover:ring-blue-300 group-hover:ring-opacity-30 hover:scale-150';

  const fakeClasses = isFake 
    ? 'bg-gray-200 border-dashed border-gray-400 text-gray-600' 
    : getCategoryColor(element?.category || '');

  const classes = `${baseClasses} ${fakeClasses} ${highlightClasses}`;

  return (
    <div 
      className={`${classes} group`}
      onClick={handleClick}
      title={`${displayElement.name} (${displayElement.symbol})`}
    >
      {/* Atomic number in top left */}
      <div className="absolute top-0 left-1 text-[6px] text-gray-600 font-normal">
        {element?.atomicNumber || '?'}
      </div>
      
      {/* Atomic weight in top right - show on hover or when highlighted */}
      {element?.atomicMass && (
        <div className={`absolute top-0 right-1 text-[6px] text-gray-500 font-normal transition-opacity duration-200 ${
          isHighlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {element.atomicMass}
        </div>
      )}
      
      {/* Element symbol in center */}
      <div className="text-lg font-bold">
        {displayElement.symbol}
      </div>
      
      {/* Element name at bottom - full name on hover or when highlighted, truncated when not */}
      <div className={`absolute bottom-1 left-1 right-1 text-[10px] text-center leading-tight font-normal ${
        isHighlighted ? '' : 'truncate group-hover:truncate-none'
      }`}>
        {displayElement.name}
      </div>
    </div>
  );
};

export default ElementTile; 