import type { Initiative, SimilarInitiative } from '../types/initiative.types.js';
import { jaccardSimilarity, tokenize } from '../utils/keywords.js';

const DEFAULT_LIMIT = 5;
const MIN_SCORE = 0.08;

function initiativeText(initiative: Initiative): string {
  const tags = initiative.tags?.join(' ') ?? '';
  return `${initiative.title} ${initiative.reason} ${tags}`;
}

/**
 * Keyword overlap similarity (no embeddings).
 * Swap for pgvector later without changing the tool contract.
 */
export function findSimilarInitiatives(
  message: string,
  initiatives: Initiative[],
  limit = DEFAULT_LIMIT,
): SimilarInitiative[] {
  const messageTokens = tokenize(message);

  return initiatives
    .map((initiative) => ({
      initiative,
      score: jaccardSimilarity(messageTokens, tokenize(initiativeText(initiative))),
    }))
    .filter((item) => item.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(limit, 5))
    .map(({ initiative }) => ({
      title: initiative.title,
      status: initiative.status,
      fit: initiative.fit,
      reason: initiative.reason,
    }));
}
