import React from 'react';
import ElementTile from './ElementTile';
import type { NameResult } from '../types';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';

interface ResultDisplayProps {
  result: NameResult | null;
  isVisible: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isVisible }) => {
  if (!isVisible || !result) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <div className="flex flex-wrap gap-2 justify-center">
        {result.orderedElements.map((element, index) => {
          const isRealElement = 'isReal' in element && element.isReal;
          const isSpace = 'symbol' in element && element.symbol === ' ';
          
          if (isSpace) {
            return (
              <div key={`element-${index}`} className="w-4 h-14 flex items-center justify-center">
                <span className="text-gray-400 text-xs">•</span>
              </div>
            );
          }
          
          return (
            <div key={`element-${index}`} className="w-14 h-14">
              <ElementTile
                element={isRealElement ? element as Element : undefined}
                fakeElement={!isRealElement ? element as FakeElement : undefined}
                isHighlighted={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultDisplay; 