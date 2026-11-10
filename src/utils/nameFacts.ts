import { matchNameToElements } from './elementMatcher';
import { ELEMENT_FACTS } from '../data/elementFacts';
import { relatedPopularNames } from '../data/popularNames';

export interface NameFactLine {
  symbol: string;
  elementName: string | null;
  fact: string | null;
}

export interface NameFacts {
  name: string;
  symbols: string[];
  realCount: number;
  total: number;
  lines: NameFactLine[];
  related: string[];
}

const RELATED_COUNT = 8;

export function buildNameFacts(name: string): NameFacts {
  const result = matchNameToElements(name);
  const tiles = result.orderedElements.filter(el => el.symbol !== ' ');
  const seen = new Set<string>();
  const lines: NameFactLine[] = [];
  for (const el of tiles) {
    if (seen.has(el.symbol)) continue;
    seen.add(el.symbol);
    const isReal = 'atomicNumber' in el;
    lines.push({
      symbol: el.symbol,
      elementName: isReal ? el.name : null,
      fact: isReal ? ELEMENT_FACTS[el.symbol] ?? null : null,
    });
  }
  return {
    name,
    symbols: tiles.map(el => el.symbol),
    realCount: result.realElementsCount,
    total: tiles.length,
    lines,
    related: relatedPopularNames(name, RELATED_COUNT),
  };
}

export function nameFactsSummary(facts: NameFacts): string {
  const spelled = facts.symbols.join(' · ');
  if (facts.realCount === facts.total) {
    return `${facts.name} can be spelled entirely with real elements: ${spelled}.`;
  }
  const rest = facts.total - facts.realCount === 1 ? 'the other is a newly discovered one' : 'the rest are newly discovered ones';
  return `${facts.name} is spelled ${spelled}: ${facts.realCount} of ${facts.total} tiles are real elements, and ${rest}.`;
}

export function missingLetterNote(symbol: string): string {
  return `No element has the symbol ${symbol} yet, so it gets a newly discovered one.`;
}
