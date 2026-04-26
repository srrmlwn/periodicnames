import { useState, useRef } from 'react';
import Header from './components/Header';
import NameInput from './components/NameInput';
import ResultDisplay from './components/ResultDisplay';
import PeriodicTable from './components/PeriodicTable';
import { matchNameToElements } from './utils/elementMatcher';
import type { NameResult } from './types';

type AnimationPhase = 'input' | 'revealing' | 'done';

function App() {
  const [result, setResult] = useState<NameResult | null>(null);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('input');
  const [revealedCount, setRevealedCount] = useState(0);
  const [inputKey, setInputKey] = useState(0);
  const revealTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealDelayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopReveal = () => {
    if (revealDelayTimer.current) {
      clearTimeout(revealDelayTimer.current);
      revealDelayTimer.current = null;
    }
    if (revealTimer.current) {
      clearInterval(revealTimer.current);
      revealTimer.current = null;
    }
  };

  const handleNameSubmit = (name: string) => {
    stopReveal();
    const nameResult = matchNameToElements(name);
    const total = nameResult.orderedElements.length;

    setResult(nameResult);
    setRevealedCount(0);
    setAnimationPhase('revealing');

    // Wait for table zoom (0.5s) + pause (0.5s) before starting elements
    revealDelayTimer.current = setTimeout(() => {
      setRevealedCount(1);

      if (total <= 1) {
        setTimeout(() => setAnimationPhase('done'), 300);
        return;
      }

      let count = 1;
      revealTimer.current = setInterval(() => {
        count++;
        setRevealedCount(count);
        if (count >= total) {
          stopReveal();
          setTimeout(() => setAnimationPhase('done'), 300);
        }
      }, 500);
    }, 1000);
  };

  const handleRefresh = () => {
    stopReveal();
    setResult(null);
    setRevealedCount(0);
    setAnimationPhase('input');
    setInputKey(k => k + 1);
  };

  const isCompact = animationPhase !== 'input';
  const revealedSymbols = result
    ? result.orderedElements.slice(0, revealedCount).map(e => e.symbol)
    : [];
  const currentElement = result && revealedCount > 0
    ? result.orderedElements[revealedCount - 1]
    : null;
  const activeSymbol = currentElement && 'atomicNumber' in currentElement
    ? currentElement.symbol
    : null;

  return (
    <div className="min-h-screen bg-slate-100 py-4">
      <div className="container mx-auto px-4">
        <Header />

        <div className={`mb-3 ${isCompact ? 'hidden md:block' : ''}`}>
          <PeriodicTable
            highlightedElements={revealedSymbols}
            compact={isCompact}
            isResults={isCompact}
            activeSymbol={activeSymbol}
            revealCount={revealedCount}
          />
        </div>

        <div className="flex items-center justify-center mb-3">
          <NameInput
            key={inputKey}
            onSubmit={handleNameSubmit}
            hasResult={isCompact}
            onRefresh={handleRefresh}
          />
        </div>

        <ResultDisplay
          result={result}
          isVisible={isCompact}
          revealedCount={revealedCount}
          isDone={animationPhase === 'done'}
        />
      </div>
    </div>
  );
}

export default App;
