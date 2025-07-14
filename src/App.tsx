import { useState } from 'react';
import Header from './components/Header';
import NameInput from './components/NameInput';
import ResultDisplay from './components/ResultDisplay';
import PeriodicTable from './components/PeriodicTable';
import { matchNameToElements } from './utils/elementMatcher';
import type { NameResult } from './types';

function App() {
  const [result, setResult] = useState<NameResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightedElements, setHighlightedElements] = useState<string[]>([]);

  const handleNameSubmit = (name: string) => {
    setIsLoading(true);
    setIsVisible(false);
    setHighlightedElements([]);
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      const nameResult = matchNameToElements(name);
      setResult(nameResult);
      setIsVisible(true);
      setIsLoading(false);
      
      // Highlight the elements used in the result
      const usedElements = [
        ...nameResult.elements.map((e: { symbol: string }) => e.symbol),
        ...nameResult.fakeElements.map((e: { symbol: string }) => e.symbol)
      ];
      setHighlightedElements(usedElements);
    }, 500);
  };



  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Header />
        <NameInput onSubmit={handleNameSubmit} isLoading={isLoading} />
        <ResultDisplay result={result} isVisible={isVisible} />
        <PeriodicTable 
          highlightedElements={highlightedElements}
        />
      </div>
    </div>
  );
}

export default App;
