import type { Element } from '../data/elements';
import type { FakeElement } from '../data/fakeElements';

export interface NameResult {
  originalName: string;
  elements: Element[];
  fakeElements: FakeElement[];
  totalElements: number;
  realElementsCount: number;
}

export interface AnimationState {
  isAnimating: boolean;
  currentStep: number;
}

export interface ElementMatcherResult {
  result: NameResult | null;
  isLoading: boolean;
  error: string | null;
} 