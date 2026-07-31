import type { InitiativeSummary } from '@/types/initiative';

/**
 * TODO(backend): GET /api/initiatives
 * TODO(backend): POST /api/initiatives
 * TODO(backend): GET /api/initiatives/:id
 *
 * For now the frontend maps conversations → initiative summaries locally.
 */
export async function listInitiatives(): Promise<InitiativeSummary[]> {
  return [];
}

export async function createInitiative(name: string): Promise<InitiativeSummary> {
  void name;
  throw new Error('TODO(backend): POST /api/initiatives is not implemented yet');
}
