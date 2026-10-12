import {
  DataSet,
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from 'obscenity';
import type { MatchPayload } from 'obscenity';

const NAME_SAFE_WORDS = new Set(['dick']);
const ALWAYS_BLOCKED_FRAGMENTS = ['nigg', 'fagg'];
const CAPTION_ALLOWED_PHRASES = ['cum laude'];

const englishBuilt = englishDataset.build();

const captionMatcher = new RegExpMatcher({
  ...englishBuilt,
  whitelistedTerms: [...(englishBuilt.whitelistedTerms ?? []), ...CAPTION_ALLOWED_PHRASES],
  ...englishRecommendedTransformers,
});

const nameDataset = new DataSet<{ originalWord: string }>()
  .addAll(englishDataset)
  .removePhrasesIf(phrase => NAME_SAFE_WORDS.has(phrase.metadata?.originalWord ?? ''));

const nameMatcher = new RegExpMatcher({
  ...nameDataset.build(),
  ...englishRecommendedTransformers,
});

const isLetter = (ch: string | undefined): boolean => !!ch && /\p{L}/u.test(ch);

function isWholeWord(text: string, match: MatchPayload): boolean {
  return !isLetter(text[match.startIndex - 1]) && !isLetter(text[match.endIndex + 1]);
}

export function isOffensiveCaption(text: string): boolean {
  return containsBlockedFragment(text) || captionMatcher.hasMatch(text);
}

const containsBlockedFragment = (text: string): boolean => {
  const squashed = text.toLowerCase().replace(/[^a-z]/g, '');
  return ALWAYS_BLOCKED_FRAGMENTS.some(fragment => squashed.includes(fragment));
};

export function isOffensiveName(text: string): boolean {
  return containsBlockedFragment(text) || nameMatcher.getAllMatches(text).some(match => isWholeWord(text, match));
}
