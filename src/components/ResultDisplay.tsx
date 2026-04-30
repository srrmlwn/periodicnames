import React, { useState, useEffect, useRef } from 'react';
import ElementTile from './ElementTile';
import SharePreviewModal from './SharePreviewModal';
import PrintPanel from './PrintPanel';
import { createElementLayout } from '../utils/elementRenderer';
import type { NameResult } from '../types';

function getFunStatsLine(realCount: number, total: number): string {
  if (total === 0) return '';
  if (realCount === total) {
    return total === 1
      ? "100% real — the periodic table had you covered."
      : `All ${total} real — the periodic table had you covered.`;
  }
  if (realCount === 0) return "Zero real elements — you're beyond the known periodic table.";
  const pct = realCount / total;
  if (pct >= 0.75) return `${realCount} of ${total} real — practically a chemist.`;
  if (pct >= 0.5) return `${realCount} of ${total} real — more fact than fiction.`;
  return `${realCount} of ${total} real — science is still catching up to you.`;
}

interface ResultDisplayProps {
  result: NameResult | null;
  isVisible: boolean;
  revealedCount: number;
  isDone: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isVisible, revealedCount, isDone }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPrintPanelOpen, setIsPrintPanelOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldRenderRef = useRef(false);

  useEffect(() => {
    if (isVisible) {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      shouldRenderRef.current = true;
      setShouldRender(true);
      setIsExiting(false);
    } else if (shouldRenderRef.current) {
      setIsExiting(true);
      exitTimerRef.current = setTimeout(() => {
        shouldRenderRef.current = false;
        setShouldRender(false);
        setIsExiting(false);
      }, 300);
    }
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [isVisible]);

  if (!shouldRender || !result) return null;

  const layout = createElementLayout(result);

  type WordGroup = { items: typeof layout.items; isSpace: boolean };
  const wordGroups: WordGroup[] = [];
  let currentWord: typeof layout.items = [];
  layout.items.forEach(item => {
    if (item.type === 'space') {
      if (currentWord.length > 0) {
        wordGroups.push({ items: currentWord, isSpace: false });
        currentWord = [];
      }
      wordGroups.push({ items: [item], isSpace: true });
    } else {
      currentWord.push(item);
    }
  });
  if (currentWord.length > 0) wordGroups.push({ items: currentWord, isSpace: false });

  return (
    <div className={`w-full ${isExiting ? 'result-exit' : 'results-fade-in'}`}>
      <div className="flex flex-wrap gap-1 sm:gap-2 justify-center items-end">
        {wordGroups.map((group, gi) => {
          if (group.isSpace) {
            const item = group.items[0];
            return (
              <div
                key={`space-${gi}`}
                className={`w-4 h-12 sm:w-6 sm:h-16 flex items-center justify-center transition-opacity duration-200 ${
                  item.index < revealedCount ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className="text-slate-500 text-lg font-bold">·</span>
              </div>
            );
          }

          return (
            <div key={`word-${gi}`} className="flex gap-1 sm:gap-2 flex-wrap justify-center">
              {group.items.map(item => (
                <div
                  key={`el-${item.index}`}
                  className={`w-12 h-12 sm:w-16 sm:h-16 hover:z-30 transition-opacity duration-200 ${item.index < revealedCount ? 'opacity-100' : 'opacity-0'}`}
                >
                  <ElementTile
                    element={item.element}
                    fakeElement={item.fakeElement}
                    isHighlighted={false}
                    animationDelay={0}
                    size="lg"
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {isDone && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-5 py-2.5 bg-slate-800 text-white font-semibold text-sm rounded-xl hover:bg-slate-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            <button
              onClick={() => setIsPrintPanelOpen(true)}
              className="px-5 py-2.5 bg-amber-500 text-white font-semibold text-sm rounded-xl hover:bg-amber-400 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Print on merch
            </button>
          </div>
          <p className="text-xs text-slate-400 italic">
            {getFunStatsLine(result.realElementsCount, result.totalElements)}
          </p>
          {result.fakeElements.some(fe => fe.symbol !== ' ') && (
            <p className="text-xs text-slate-400">* fictional element</p>
          )}
        </div>
      )}

      <SharePreviewModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        result={result}
      />
      <PrintPanel
        isOpen={isPrintPanelOpen}
        onClose={() => setIsPrintPanelOpen(false)}
        result={result}
      />
    </div>
  );
};

export default ResultDisplay;
