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
const TABLE_INSET = 48; // px breathing room on each side (desktop only)
const TABLE_MAX_SCALE = 1.5; // cap tile size so table never overwhelms the UI

function getTableScale() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // On mobile (<640px) skip the inset so the table fills the width
  const inset = vw < 640 ? 0 : TABLE_INSET * 2;
  return Math.min(
    (vw - inset) / TABLE_W,
    (vh - inset) / TABLE_H,
    TABLE_MAX_SCALE
  );
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
  const [orderSuccess, setOrderSuccess] = useState(
    () => new URLSearchParams(window.location.search).get('order') === 'success'
  );
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
    if (orderSuccess) {
      history.replaceState(null, '', window.location.pathname);
    }
  }, [orderSuccess]);

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
    <div className="min-h-screen bg-slate-50">
      {orderSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-lg">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Order placed — you'll get a shipping confirmation soon!
          <button onClick={() => setOrderSuccess(false)} className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {/* Fixed full-screen periodic table background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
        <div style={{ transform: `scale(${tableScale})`, transformOrigin: 'center center' }}>
          <PeriodicTable highlightedSymbols={animationPhase === 'done' ? revealedSymbols : []} />
        </div>
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col" style={{ minHeight: '100dvh' }}>
        <div className="px-4 pt-4 shrink-0">
          <Header />
        </div>
        {/* Single column: input at ~45% from top, results grow downward without moving input */}
        <div className="content-wrap flex flex-col items-center px-4 pb-8 gap-4">
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
        <footer className="mt-auto px-4 py-4 text-center text-sm text-slate-400 space-y-1">
          <p>
            Turn your name into a custom t-shirt
            <span className="text-amber-400 font-semibold block sm:inline"> · Printed &amp; shipped by Printful</span>
          </p>
          <p className="sm:hidden text-xs">
            <a href="/privacy.html" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <span className="mx-2">·</span>
            <a href="/tos.html" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </p>
        </footer>
        <div className="hidden sm:block fixed bottom-4 left-4 text-xs text-slate-500 space-x-3">
          <a href="/privacy.html" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="/tos.html" className="hover:text-slate-300 transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}

export default App;
