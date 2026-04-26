import React, { useState, useEffect, useRef } from 'react';
import ElementTile from './ElementTile';
import ShareButton from './ShareButton';
import { ShareImageGenerator } from '../utils/ShareImageGenerator';
import { createElementLayout } from '../utils/elementRenderer';
import type { NameResult } from '../types';

interface ResultDisplayProps {
  result: NameResult | null;
  isVisible: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isVisible }) => {
  const [animatedElements, setAnimatedElements] = useState<number[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldRenderRef = useRef(false);

  const handleShare = async (platform: 'x' | 'instagram') => {
    if (!result) return;

    setIsGenerating(true);
    try {
      const generator = new ShareImageGenerator();
      const imageBlob = platform === 'x'
        ? await generator.generateXImage(result)
        : await generator.generateInstagramImage(result);

      const imageUrl = URL.createObjectURL(imageBlob);
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `periodic-names-${platform}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

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

  return (
    <div className={`max-w-4xl mx-auto mt-4 p-4 bg-white rounded-lg shadow-lg ${
      isExiting ? 'result-exit' : 'results-fade-in'
    }`}>
      <div className="flex flex-wrap gap-2 justify-center">
        {layout.items.map((item, index) => {
          const isAnimated = animatedElements.includes(index);

          if (item.type === 'space') {
            return (
              <div
                key={`element-${index}`}
                className={`w-6 h-16 flex items-center justify-center ${
                  isAnimated ? 'tile-pop' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 65}ms` }}
              >
                <span className="text-slate-300 text-lg font-bold">·</span>
              </div>
            );
          }

          return (
            <div
              key={`element-${index}`}
              className={`w-16 h-16 hover:z-30 ${
                isAnimated ? 'tile-pop' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 65}ms` }}
            >
              <ElementTile
                element={item.element}
                fakeElement={item.fakeElement}
                isHighlighted={false}
                animationDelay={index * 50}
                size="lg"
              />
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
        <div className="mt-4 flex justify-center space-x-3">
          <ShareButton
            platform="x"
            onClick={() => handleShare('x')}
            className={isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
          />
          <ShareButton
            platform="instagram"
            onClick={() => handleShare('instagram')}
            className={isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
          />
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
