import React, { useState, useEffect } from 'react';
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

  const handleShare = async (platform: 'x' | 'instagram') => {
    if (!result) return;
    
    setIsGenerating(true);
    try {
      const generator = new ShareImageGenerator();
      const imageBlob = platform === 'x' 
        ? await generator.generateXImage(result)
        : await generator.generateInstagramImage(result);
      
      // Create a temporary URL for the blob
      const imageUrl = URL.createObjectURL(imageBlob);
      
      // For now, we'll just download the image
      // In a real implementation, you'd integrate with platform APIs
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `periodic-names-${platform}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error('Failed to generate image:', error);
      // Could add toast notification here
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger animations when result changes
  useEffect(() => {
    if (isVisible && result) {
      setAnimatedElements([]);
      setShowSuccessMessage(false);
      
      // Stagger the animation of each element
      result.orderedElements.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedElements(prev => [...prev, index]);
        }, index * 100); // 100ms delay between each element
      });
      
      // Show success message after all animations complete
      const totalAnimationTime = (result.orderedElements.length - 1) * 100 + 500; // Last element delay + transition duration
      setTimeout(() => {
        setShowSuccessMessage(true);
      }, totalAnimationTime + 200); // Extra 200ms buffer
    } else {
      setAnimatedElements([]);
      setShowSuccessMessage(false);
    }
  }, [result, isVisible]);

  if (!isVisible || !result) {
    return null;
  }

  // Create element layout using shared utility
  const layout = createElementLayout(result);

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg element-fade-in">
      <div className="flex flex-wrap gap-0.5 justify-center">
        {layout.items.map((item, index) => {
          const isAnimated = animatedElements.includes(index);
          
          if (item.type === 'space') {
            return (
              <div 
                key={`element-${index}`} 
                className={`w-4 h-14 flex items-center justify-center transition-all duration-300 ${
                  isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <span className="text-slate-400 text-xs">•</span>
              </div>
            );
          }
          
          return (
            <div 
              key={`element-${index}`} 
              className={`w-14 h-14 transition-all duration-500 ease-out hover:z-30 ${
                isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <ElementTile
                element={item.element}
                fakeElement={item.fakeElement}
                isHighlighted={false}
                animationDelay={index * 50}
              />
            </div>
          );
        })}
      </div>

      {/* Success message with animation */}
      {showSuccessMessage && (
        <div className="mt-6 text-center">
          <div className="inline-block px-4 py-2 bg-lime-100 text-lime-800 border border-lime-600 rounded-full text-sm font-medium element-fade-in">
          🥳 Name successfully spelled with {layout.realElementsCount} real elements!
          </div>
        </div>
      )}
      
      {/* Share buttons */}
      {showSuccessMessage && (
        <div className="mt-6 flex justify-center space-x-4">
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