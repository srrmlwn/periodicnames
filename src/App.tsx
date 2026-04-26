import { useState } from 'react';
import Header from './components/Header';
import NameInput from './components/NameInput';
import ResultDisplay from './components/ResultDisplay';
import PeriodicTable from './components/PeriodicTable';
import { matchNameToElements } from './utils/elementMatcher';
import type { NameResult } from './types';

type AnimationPhase = 'input' | 'processing' | 'results';

function App() {
  const [result, setResult] = useState<NameResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightedElements, setHighlightedElements] = useState<string[]>([]);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('input');
  const [inputKey, setInputKey] = useState(0);

  const handleNameSubmit = (name: string) => {
    setIsLoading(true);
    setIsVisible(false);
    setHighlightedElements([]);
    setAnimationPhase('processing');

    setTimeout(() => {
      const nameResult = matchNameToElements(name);
      setResult(nameResult);
      setIsVisible(true);
      setIsLoading(false);
      setAnimationPhase('results');

      const usedElements = [
        ...nameResult.elements.map((e: { symbol: string }) => e.symbol),
        ...nameResult.fakeElements.map((e: { symbol: string }) => e.symbol)
      ];
      setHighlightedElements(usedElements);
    }, 500);
  };

  const handleRefresh = () => {
    setResult(null);
    setIsVisible(false);
    setHighlightedElements([]);
    setAnimationPhase('input');
    setInputKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-slate-100 py-4">
      <div className="container mx-auto px-4">
        <Header />

        {/* Periodic Table - hidden only during processing */}
        <div className={`transition-all duration-500 ease-in-out mb-4 ${
          animationPhase === 'processing' ? 'opacity-50' : 'opacity-100'
        }`}>
          <PeriodicTable highlightedElements={highlightedElements} />
        </div>
        <p className="text-xs text-gray-400 text-center mt-1 md:hidden">← scroll to see full table →</p>

        {/* Processing spinner */}
        {animationPhase === 'processing' && (
          <div className="flex justify-center items-center py-4">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Finding elements...</span>
            </div>
          </div>
        )}

        {/* Name input + refresh button */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <NameInput key={inputKey} onSubmit={handleNameSubmit} isLoading={isLoading} />
          {animationPhase === 'results' && (
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 rounded-lg hover:bg-gray-100"
              title="Try a new name"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>

        <ResultDisplay result={result} isVisible={isVisible} />
      </div>
    </div>
  );
}

export default App;
