const STOP_WORDS = new Set([
  'a',
  'al',
  'con',
  'de',
  'del',
  'el',
  'en',
  'es',
  'esta',
  'este',
  'la',
  'las',
  'lo',
  'los',
  'mi',
  'para',
  'por',
  'que',
  'se',
  'su',
  'un',
  'una',
  'unos',
  'unas',
  'y',
  'o',
  'the',
  'and',
  'for',
  'with',
  'to',
  'of',
  'in',
  'on',
  'is',
  'are',
  'tengo',
  'idea',
  'quiero',
  'necesitamos',
  'necesitamos',
]);

/** Normalizes text into meaningful lowercase tokens for keyword matching. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function hasAnyKeyword(text: string, keywords: string[]): boolean {
  const tokens = new Set(tokenize(text));
  return keywords.some((keyword) => tokens.has(keyword.toLowerCase()));
}

export function countKeywordHits(text: string, keywords: string[]): number {
  const tokens = new Set(tokenize(text));
  return keywords.reduce((count, keyword) => {
    return tokens.has(keyword.toLowerCase()) ? count + 1 : count;
  }, 0);
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;

  for (const token of setA) {
    if (setB.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}
