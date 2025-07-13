import React, { useState } from 'react';
import Header from './components/Header';
import NameInput from './components/NameInput';
import ResultDisplay from './components/ResultDisplay';
import { matchName } from './utils/elementMatcher';
import type { NameResult } from './types';

function App() {
  const [result, setResult] = useState<NameResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleNameSubmit = (name: string) => {
    setIsLoading(true);
    setIsVisible(false);
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      const nameResult = matchName(name);
      setResult(nameResult);
      setIsVisible(true);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Header />
        <NameInput onSubmit={handleNameSubmit} isLoading={isLoading} />
        <ResultDisplay result={result} isVisible={isVisible} />
      </div>
    </div>
  );
}

export default App;
