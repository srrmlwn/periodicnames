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

export function nameFactsSummaryLines(facts: NameFacts): string[] {
  const lines = [facts.symbols.join(' · ')];
  const newCount = facts.total - facts.realCount;
  if (newCount === 0) {
    lines.push(`All ${facts.total} tiles are real elements.`);
  } else {
    lines.push(`${facts.realCount} of ${facts.total} tiles are real elements.`);
    lines.push(newCount === 1 ? '1 is a newly discovered element.' : `${newCount} are newly discovered elements.`);
  }
  return lines;
}

export function missingLetterNote(symbol: string): string {
  return `No element has the symbol ${symbol} yet, so it gets a newly discovered one.`;
}
