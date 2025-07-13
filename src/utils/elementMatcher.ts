import { getElementBySymbol, getAllElements } from '../data/elements';
import { getFakeElementBySymbol, getAllFakeElements } from '../data/fakeElements';
import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';
import type { NameResult } from '../types';

export function matchName(name: string): NameResult {
  const normalizedName = name.toUpperCase().replace(/\s/g, '');
  const realElements = getAllElements();
  const fakeElements = getAllFakeElements();
  
  const result: NameResult = {
    originalName: name,
    elements: [],
    fakeElements: [],
    totalElements: 0,
    realElementsCount: 0
  };
  
  let remainingName = normalizedName;
  
  // Try to match with real elements first (greedy approach)
  while (remainingName.length > 0) {
    let matched = false;
    
    // Try longest possible real element symbols first
    for (let length = Math.min(remainingName.length, 3); length >= 1; length--) {
      const candidate = remainingName.substring(0, length);
      const element = getElementBySymbol(candidate);
      
      if (element) {
        result.elements.push(element);
        result.realElementsCount++;
        remainingName = remainingName.substring(length);
        matched = true;
        break;
      }
    }
    
    // If no real element found, try fake elements
    if (!matched) {
      const firstChar = remainingName[0];
      const fakeElement = getFakeElementBySymbol(firstChar);
      
      if (fakeElement) {
        result.fakeElements.push(fakeElement);
        remainingName = remainingName.substring(1);
      } else {
        // If even fake element not found, skip this character
        remainingName = remainingName.substring(1);
      }
    }
  }
  
  result.totalElements = result.elements.length + result.fakeElements.length;
  
  return result;
}

// Test function for development
export function testElementMatching() {
  const testNames = ['Sriram', 'Carlos', 'Moses'];
  
  testNames.forEach(name => {
    const result = matchName(name);
    console.log(`${name}:`, result);
  });
} 