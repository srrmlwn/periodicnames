import React, { useState, useEffect, useRef } from 'react';
import ElementTile from './ElementTile';
import SharePreviewModal from './SharePreviewModal';
import { createElementLayout } from '../utils/elementRenderer';
import type { NameResult } from '../types';

interface ResultDisplayProps {
  result: NameResult | null;
  isVisible: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isVisible }) => {
  const [animatedElements, setAnimatedElements] = useState<number[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && result) {
      setAnimatedElements([]);
      setShowSuccessMessage(false);

      result.orderedElements.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedElements(prev => [...prev, index]);
        }, index * 65);
      });

      const totalAnimationTime = (result.orderedElements.length - 1) * 65 + 450;
      setTimeout(() => {
        setShowSuccessMessage(true);
      }, totalAnimationTime + 200);
    } else {
      setAnimatedElements([]);
      setShowSuccessMessage(false);
    }
  }, [result, isVisible]);

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
    <div className={`max-w-4xl mx-auto mt-4 p-4 bg-white rounded-lg shadow-lg ${
      isExiting ? 'result-exit' : 'results-fade-in'
    }`}>
      <div className="flex flex-wrap gap-2 justify-center items-center">
        {wordGroups.map((group, gi) => {
          if (group.isSpace) {
            const item = group.items[0];
            const isAnimated = animatedElements.includes(item.index);
            return (
              <div
                key={`space-${gi}`}
                className={`w-6 h-16 flex items-center justify-center ${
                  isAnimated ? 'tile-pop' : 'opacity-0'
                }`}
                style={{ animationDelay: `${item.index * 65}ms` }}
              >
                <span className="text-slate-300 text-lg font-bold">·</span>
              </div>
            );
          }

          return (
            <div key={`word-${gi}`} className="flex gap-2 flex-nowrap">
              {group.items.map(item => {
                const isAnimated = animatedElements.includes(item.index);
                return (
                  <div
                    key={`el-${item.index}`}
                    className={`w-16 h-16 hover:z-30 ${isAnimated ? 'tile-pop' : 'opacity-0'}`}
                    style={{ animationDelay: `${item.index * 65}ms` }}
                  >
                    <ElementTile
                      element={item.element}
                      fakeElement={item.fakeElement}
                      isHighlighted={false}
                      animationDelay={item.index * 50}
                      size="lg"
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {showSuccessMessage && (
        <div className="mt-4 text-center">
          <div className="inline-block px-3 py-1 bg-lime-100 text-lime-800 border border-lime-600 rounded-full text-xs font-medium element-fade-in">
            🥳 Name successfully spelled with {layout.realElementsCount} real elements!
          </div>
        </div>
      )}

      {showSuccessMessage && (
        <div className="mt-4 flex justify-center">
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
        </div>
      )}

      <SharePreviewModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        result={result}
      />
    </div>
  );
};

export default ResultDisplay;
