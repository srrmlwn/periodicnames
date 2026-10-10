import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import Header from './components/Header';
import NameInput from './components/NameInput';
import ResultDisplay from './components/ResultDisplay';
import PeriodicTable from './components/PeriodicTable';
import { matchNameToElements } from './utils/elementMatcher';
import { getTileColors } from './utils/colorSchemes';
import type { NameResult } from './types';

type AnimationPhase = 'input' | 'revealing' | 'done';

// Natural size of the periodic table grid (18 cols × 9 rows, w-10 tiles, gap-0.5)
const TABLE_W = 754; // 18*40 + 17*2
const TABLE_H = 376; // 9*40 + 8*2
const TABLE_SIDE_PAD = 32;
const RESULT_CARD_RESERVE = 310;
const TABLE_MIN_SCALE = 0.45;
const TABLE_MAX_SCALE = 1.15;

function getTableScale(tableTop: number) {
  const byWidth = (window.innerWidth - TABLE_SIDE_PAD) / TABLE_W;
  const byHeight = Math.max(TABLE_MIN_SCALE, (window.innerHeight - tableTop - RESULT_CARD_RESERVE) / TABLE_H);
  return Math.min(byWidth, byHeight, TABLE_MAX_SCALE);
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
  const [tableScale, setTableScale] = useState(TABLE_MIN_SCALE);
  const tableRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
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

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tableRef.current) return;
      const tableTop = tableRef.current.getBoundingClientRect().top + window.scrollY;
      setTableScale(getTableScale(tableTop));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (animationPhase !== 'done' || !resultRef.current) return;
    if (resultRef.current.getBoundingClientRect().bottom <= window.innerHeight) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultRef.current.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' });
  }, [animationPhase]);

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

  const litColors = new Map<string, string>();
  if (result) {
    const colors = getTileColors(result);
    result.orderedElements.slice(0, revealedCount).forEach((el, i) => {
      if ('atomicNumber' in el && !litColors.has(el.symbol)) litColors.set(el.symbol, colors[i]);
    });
  }

  return (
    <div className="min-h-screen">
      {orderSuccess && (
        <div role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md flex items-center gap-3 bg-pop-mint text-ink text-sm font-bold px-4 py-3 rounded-xl border-[3px] border-ink shadow-brutal sticker-in">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Order placed — you'll get a shipping confirmation soon!
          <button onClick={() => setOrderSuccess(false)} aria-label="Dismiss" className="nb-focus ml-auto shrink-0 rounded p-0.5 hover:bg-ink/10">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
        <div className="px-4 pt-4 shrink-0">
          <Header />
        </div>
        <div className="flex flex-col items-center px-4 pt-4 sm:pt-6 pb-8 gap-5 sm:gap-6">
          <NameInput
            key={inputKey}
            onSubmit={handleNameSubmit}
            hasResult={animationPhase !== 'input'}
            onRefresh={handleRefresh}
            initialValue={inputKey === 0 ? urlName : ''}
          />
          <div
            ref={tableRef}
            className="pointer-events-none shrink-0"
            style={{ width: TABLE_W * tableScale, height: TABLE_H * tableScale }}
            aria-hidden="true"
          >
            <div style={{ width: TABLE_W, height: TABLE_H, transform: `scale(${tableScale})`, transformOrigin: 'top left' }}>
              <PeriodicTable litColors={litColors} />
            </div>
          </div>
          <div ref={resultRef} className="w-full scroll-mb-4">
          <ResultDisplay
            result={result}
            isVisible={animationPhase !== 'input'}
            revealedCount={revealedCount}
            isDone={animationPhase === 'done'}
          />
          </div>
        </div>
        <footer className="mt-auto px-4 py-5 text-center text-sm font-medium text-muted space-y-1.5">
          <p>
            Turn your name into a custom t-shirt
            <span className="text-ink font-bold block sm:inline"> · Printed and shipped by Printful</span>
          </p>
          <p className="text-xs">
            <a href="/privacy.html" className="underline decoration-2 underline-offset-2 hover:text-ink">Privacy Policy</a>
            <span className="mx-2">·</span>
            <a href="/tos.html" className="underline decoration-2 underline-offset-2 hover:text-ink">Terms of Service</a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
