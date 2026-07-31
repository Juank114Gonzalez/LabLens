import { getAllInitiatives } from '../../repositories/initiative.repository.js';
import { findSimilarInitiatives } from '../../services/similarity.service.js';
import { findSimilarInitiativesArgsSchema } from './schema.js';

export async function executeFindSimilarInitiatives(
  rawArgs: Record<string, unknown>,
) {
  const args = findSimilarInitiativesArgsSchema.parse(rawArgs);
  const initiatives = await getAllInitiatives();
  const results = findSimilarInitiatives(
    args.description,
    initiatives,
    args.limit ?? 5,
  );

  return {
    count: results.length,
    results,
  };
}
