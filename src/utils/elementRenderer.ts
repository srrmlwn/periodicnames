import type { NameResult } from '../types';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';
import { getCategoryBorderColor, getFakeElementBorderColor, getTileColors } from './colorSchemes';

export interface ElementRenderItem {
  type: 'element' | 'space';
  element?: Element;
  fakeElement?: FakeElement;
  index: number;
  color: string;
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
  const colors = getTileColors(result);
  const items: ElementRenderItem[] = result.orderedElements.map((element, index) => {
    const isRealElement = 'isReal' in element && element.isReal;
    const isSpace = 'symbol' in element && element.symbol === ' ';
    
    if (isSpace) {
      return {
        type: 'space',
        index,
        color: colors[index]
      };
    }
    
    if (isRealElement) {
      return {
        type: 'element',
        element: element as Element,
        index,
        color: colors[index]
      };
    } else {
      return {
        type: 'element',
        fakeElement: element as FakeElement,
        index,
        color: colors[index]
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
  
  const backgroundColor = item.color;
  const borderColor = isFake ? getFakeElementBorderColor() : getCategoryBorderColor((element as Element).category);
  
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
