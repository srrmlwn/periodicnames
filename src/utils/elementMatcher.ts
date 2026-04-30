import { getAllElements } from '../data/elements';
import { getFakeElementBySymbol } from '../data/fakeElements';
import type { FakeElement } from '../data/fakeElements';
import type { NameResult } from '../types';

function titleCase(s: string): string {
  if (s.length === 0) return s;
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

function matchWordToElements(
  word: string,
  realElements: ReturnType<typeof getAllElements>,
  usedFakeNames: Set<string>
): (ReturnType<typeof getAllElements>[number] | FakeElement)[] {
  const n = word.length;

  // dp[i] = max real element count achievable from position i to end
  const dp = new Array<number>(n + 1).fill(0);
  // choice[i] = { len, isReal } — what to pick at position i
  const choice = new Array<{ len: number; isReal: boolean }>(n);

  for (let i = n - 1; i >= 0; i--) {
    let bestScore = -1;
    let bestChoice = { len: 1, isReal: false };

    for (const len of [2, 1]) {
      if (i + len > n) continue;
      const candidate = titleCase(word.substring(i, i + len));
      const realMatch = realElements.find(el => el.symbol === candidate);

      if (realMatch) {
        const score = dp[i + len] + 1;
        if (score > bestScore) {
          bestScore = score;
          bestChoice = { len, isReal: true };
        }
      } else if (len === 1) {
        // Fake element fallback for single character
        const score = dp[i + 1] + 0;
        if (score > bestScore) {
          bestScore = score;
          bestChoice = { len: 1, isReal: false };
        }
      }
    }

    dp[i] = bestScore === -1 ? 0 : bestScore;
    choice[i] = bestChoice;
  }

  const ordered: (ReturnType<typeof getAllElements>[number] | FakeElement)[] = [];
  let pos = 0;
  while (pos < n) {
    const { len, isReal } = choice[pos];
    if (isReal) {
      const candidate = titleCase(word.substring(pos, pos + len));
      const el = realElements.find(el => el.symbol === candidate);
      if (el) ordered.push(el);
    } else {
      const fakeEl = getFakeElementBySymbol(word[pos], usedFakeNames);
      if (fakeEl) {
        usedFakeNames.add(fakeEl.name);
        ordered.push(fakeEl);
      }
    }
    pos += len;
  }

  return ordered;
}

export function matchNameToElements(name: string): NameResult {
  const realElements = getAllElements();


  const result: NameResult = {
    originalName: name,
    elements: [],
    fakeElements: [],
    orderedElements: [],
    totalElements: 0,
    realElementsCount: 0,
  };

  const spaceElement: FakeElement = { symbol: ' ', name: 'Space', color: '#FFFFFF' };
  const words = name.toUpperCase().split(' ');
  const usedFakeNames = new Set<string>();

  words.forEach((word, wordIndex) => {
    if (wordIndex > 0) {
      result.fakeElements.push(spaceElement);
      result.orderedElements.push(spaceElement);
    }

    const wordElements = matchWordToElements(word, realElements, usedFakeNames);

    for (const el of wordElements) {
      if ('atomicNumber' in el) {
        result.elements.push(el);
        result.realElementsCount++;
      } else {
        result.fakeElements.push(el);
      }
      result.orderedElements.push(el);
    }
  });

  result.totalElements = result.elements.length + result.fakeElements.filter(fe => fe.symbol !== ' ').length;

  return result;
}
