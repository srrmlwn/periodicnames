import { getAllElements } from '../data/elements';
import { getAllFakeElements } from '../data/fakeElements';
import type { NameResult } from '../types';

export function matchNameToElements(name: string): NameResult {
  const realElements = getAllElements();
  const fakeElements = getAllFakeElements();
  
  const result: NameResult = {
    originalName: name,
    elements: [],
    fakeElements: [],
    orderedElements: [],
    totalElements: 0,
    realElementsCount: 0
  };
  
  let remainingName = name.toUpperCase();
  
  // Try to match with real elements first (greedy approach)
  while (remainingName.length > 0) {
    let matched = false;
    
    // Handle spaces as special characters
    if (remainingName[0] === ' ') {
      // Add a space element to maintain spacing
      const spaceElement = { symbol: ' ', name: 'Space', color: '#FFFFFF' };
      result.fakeElements.push(spaceElement);
      result.orderedElements.push(spaceElement);
      remainingName = remainingName.substring(1);
      continue;
    }
    
    // Try longest possible real element symbols first
    for (let length = Math.min(remainingName.length, 3); length >= 1; length--) {
      const candidate = remainingName.substring(0, length);
      const element = realElements.find(el => el.symbol.toUpperCase() === candidate);
      
      if (element) {
        result.elements.push(element);
        result.orderedElements.push(element);
        result.realElementsCount++;
        remainingName = remainingName.substring(length);
        matched = true;
        break;
      }
    }
    
    // If no real element found, try fake elements
    if (!matched) {
      const firstChar = remainingName[0];
      const fakeElement = fakeElements.find(el => el.symbol === firstChar);
      
      if (fakeElement) {
        result.fakeElements.push(fakeElement);
        result.orderedElements.push(fakeElement);
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
    const result = matchNameToElements(name);
    console.log(`${name}:`, result);
  });
} 