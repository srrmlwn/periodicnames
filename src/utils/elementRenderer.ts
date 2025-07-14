import type { NameResult } from '../types';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';
import { getCategoryColor, getCategoryBorderColor, getFakeElementColor, getFakeElementBorderColor } from './colorSchemes';

export interface ElementRenderItem {
  type: 'element' | 'space';
  element?: Element;
  fakeElement?: FakeElement;
  index: number;
}

export interface ElementLayout {
  items: ElementRenderItem[];
  totalElements: number;
  realElementsCount: number;
}

/**
 * Converts a NameResult into a standardized layout that can be used
 * by both the ResultDisplay component and image generation
 */
export function createElementLayout(result: NameResult): ElementLayout {
  const items: ElementRenderItem[] = result.orderedElements.map((element, index) => {
    const isRealElement = 'isReal' in element && element.isReal;
    const isSpace = 'symbol' in element && element.symbol === ' ';
    
    if (isSpace) {
      return {
        type: 'space',
        index
      };
    }
    
    if (isRealElement) {
      return {
        type: 'element',
        element: element as Element,
        index
      };
    } else {
      return {
        type: 'element',
        fakeElement: element as FakeElement,
        index
      };
    }
  });
  
  return {
    items,
    totalElements: result.totalElements,
    realElementsCount: result.realElementsCount
  };
}

/**
 * Gets the display properties for an element (colors, styling, etc.)
 */
export function getElementDisplayProperties(item: ElementRenderItem) {
  if (item.type === 'space') {
    return {
      isSpace: true,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      symbol: '•',
      name: '',
      atomicNumber: null,
      atomicMass: null
    };
  }
  
  const element = item.element || item.fakeElement;
  if (!element) return null;
  
  const isFake = !!item.fakeElement;
  
  const backgroundColor = isFake 
    ? getFakeElementColor() 
    : getCategoryColor((element as Element).category);
  const borderColor = isFake 
    ? getFakeElementBorderColor() 
    : getCategoryBorderColor((element as Element).category);
  
  return {
    isSpace: false,
    isFake,
    backgroundColor,
    borderColor,
    symbol: element.symbol,
    name: element.name,
    atomicNumber: item.element?.atomicNumber || null,
    atomicMass: item.element?.atomicMass || null,
    category: item.element?.category || null
  };
}

/**
 * Calculates layout dimensions for image generation
 */
export function calculateImageLayout(
  layout: ElementLayout, 
  platform: 'x' | 'instagram'
) {
  const tileSize = platform === 'x' ? 80 : 100;
  const spacing = 4;
  const spaceWidth = 16; // Width of space (w-4 = 16px)
  const maxElementsPerRow = platform === 'x' ? 8 : 6;
  
  // Calculate layout including spaces
  let currentRowWidth = 0;
  let currentRowElements = 0;
  let totalHeight = 0;
  let maxRowWidth = 0;
  
  layout.items.forEach((item) => {
    if (item.type === 'space') {
      currentRowWidth += spaceWidth;
    } else {
      // Check if we need to wrap to next row
      if (currentRowElements >= maxElementsPerRow) {
        // Move to next row
        totalHeight += tileSize + spacing;
        maxRowWidth = Math.max(maxRowWidth, currentRowWidth);
        currentRowWidth = tileSize;
        currentRowElements = 1;
      } else {
        if (currentRowElements > 0) {
          currentRowWidth += spacing;
        }
        currentRowWidth += tileSize;
        currentRowElements++;
      }
    }
  });
  
  // Add height for the last row
  if (currentRowElements > 0) {
    totalHeight += tileSize;
  }
  
  // Use the maximum row width found
  const totalWidth = Math.max(maxRowWidth, currentRowWidth);
  
  return {
    tileSize,
    spacing,
    spaceWidth,
    totalWidth,
    totalHeight,
    maxElementsPerRow
  };
} 