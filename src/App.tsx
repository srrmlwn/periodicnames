import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import NameInput from './components/NameInput';
import ResultDisplay from './components/ResultDisplay';
import PeriodicTable from './components/PeriodicTable';
import { matchNameToElements } from './utils/elementMatcher';
import type { NameResult } from './types';

type AnimationPhase = 'input' | 'revealing' | 'done';

// Natural size of the periodic table grid (18 cols × 9 rows, w-10 tiles, gap-0.5)
const TABLE_W = 754; // 18*40 + 17*2
const TABLE_H = 376; // 9*40 + 8*2

function getTableScale() {
  return Math.max(window.innerWidth / TABLE_W, window.innerHeight / TABLE_H);
}

function nameFromPath(path: string): string {
  return decodeURIComponent(path)
    .replace(/-/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function App() {
  const [result, setResult] = useState<NameResult | null>(null);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('input');
  const [revealedCount, setRevealedCount] = useState(0);
  const [inputKey, setInputKey] = useState(0);
  const [tableScale, setTableScale] = useState(getTableScale);
  const revealTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealDelayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  const urlName = useState(() => {
    const path = window.location.pathname.slice(1);
    return path ? nameFromPath(path) : '';
  })[0];

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

  useEffect(() => {
    if (initialized.current || !urlName) return;
    initialized.current = true;
    handleNameSubmit(urlName);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleResize = () => setTableScale(getTableScale());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNameSubmit = (name: string) => {
    history.pushState(null, '', '/' + nameToSlug(name));
    stopReveal();
    const nameResult = matchNameToElements(name);
    const total = nameResult.orderedElements.length;

    setResult(nameResult);
    setRevealedCount(0);
    setAnimationPhase('revealing');

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
    history.pushState(null, '', '/');
    stopReveal();
    setResult(null);
    setRevealedCount(0);
    setAnimationPhase('input');
    setInputKey(k => k + 1);
  };

  const revealedSymbols = result
    ? result.orderedElements.slice(0, revealedCount).map(e => e.symbol)
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed full-screen periodic table background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
        <div style={{ transform: `scale(${tableScale})`, transformOrigin: 'center center' }}>
          <PeriodicTable highlightedSymbols={animationPhase === 'done' ? revealedSymbols : []} />
        </div>
      </div>

      {/* Content layer */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="px-4 pt-4">
          <Header />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
          <NameInput
            key={inputKey}
            onSubmit={handleNameSubmit}
            hasResult={animationPhase !== 'input'}
            onRefresh={handleRefresh}
            initialValue={inputKey === 0 ? urlName : ''}
          />
          <ResultDisplay
            result={result}
            isVisible={animationPhase !== 'input'}
            revealedCount={revealedCount}
            isDone={animationPhase === 'done'}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
