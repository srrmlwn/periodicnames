import React from 'react';
import type { NameResult } from '../types';

interface ResultDisplayProps {
  result: NameResult | null;
  isVisible: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isVisible }) => {
  if (!isVisible || !result) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {result.originalName} = 
      </h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {result.elements.map((element, index) => (
          <div
            key={`real-${index}`}
            className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg font-semibold"
          >
            {element.symbol} ({element.name})
          </div>
        ))}
        {result.fakeElements.map((element, index) => (
          <div
            key={`fake-${index}`}
            className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg font-semibold border-dashed border-2"
          >
            {element.symbol} ({element.name})
          </div>
        ))}
      </div>
      
      <div className="text-sm text-gray-600">
        <p>Total elements: {result.totalElements}</p>
        <p>Real elements: {result.realElementsCount}</p>
        <p>Fake elements: {result.fakeElements.length}</p>
      </div>
    </div>
  );
};

export default ResultDisplay; 