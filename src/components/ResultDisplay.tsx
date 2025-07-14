import React, { useState, useEffect } from 'react';
import ElementTile from './ElementTile';
import type { NameResult } from '../types';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';

interface ResultDisplayProps {
  result: NameResult | null;
  isVisible: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isVisible }) => {
  const [animatedElements, setAnimatedElements] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Trigger animations when result changes
  useEffect(() => {
    if (isVisible && result) {
      setIsAnimating(true);
      setAnimatedElements([]);
      setShowSuccessMessage(false);
      
      // Stagger the animation of each element
      result.orderedElements.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedElements(prev => [...prev, index]);
        }, index * 100); // 100ms delay between each element
      });
      
      // Show success message after all animations complete
      const totalAnimationTime = (result.orderedElements.length - 1) * 100 + 500; // Last element delay + transition duration
      setTimeout(() => {
        setShowSuccessMessage(true);
      }, totalAnimationTime + 200); // Extra 200ms buffer
    } else {
      setIsAnimating(false);
      setAnimatedElements([]);
      setShowSuccessMessage(false);
    }
  }, [result, isVisible]);

  if (!isVisible || !result) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg element-fade-in">
      <div className="flex flex-wrap gap-2 justify-center">
        {result.orderedElements.map((element, index) => {
          const isRealElement = 'isReal' in element && element.isReal;
          const isSpace = 'symbol' in element && element.symbol === ' ';
          const isAnimated = animatedElements.includes(index);
          
          if (isSpace) {
            return (
              <div 
                key={`element-${index}`} 
                className={`w-4 h-14 flex items-center justify-center transition-all duration-300 ${
                  isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <span className="text-gray-400 text-xs">•</span>
              </div>
            );
          }
          
          return (
            <div 
              key={`element-${index}`} 
              className={`w-14 h-14 transition-all duration-500 ease-out hover:z-30 ${
                isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <ElementTile
                element={isRealElement ? element as Element : undefined}
                fakeElement={!isRealElement ? element as FakeElement : undefined}
                isHighlighted={false}
                animationDelay={index * 50}
              />
            </div>
          );
        })}
      </div>
      
      {/* Success message with animation */}
      {showSuccessMessage && (
        <div className="mt-6 text-center">
          <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium element-fade-in">
            ✨ Name successfully spelled with {result.orderedElements.filter(e => 'isReal' in e && e.isReal).length} real elements!
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay; 