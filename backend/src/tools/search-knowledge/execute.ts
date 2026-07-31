import { loadKnowledgeBase } from '../../services/knowledge.service.js';
import { searchKnowledgeArgsSchema } from './schema.js';

/**
 * MVP: returns the full markdown knowledge base.
 * Future: replace body with pgvector/RAG retrieval without changing the tool contract.
 */
export async function executeSearchKnowledge(
  rawArgs: Record<string, unknown>,
): Promise<{ query: string; content: string; source: 'knowledge-markdown' }> {
  const args = searchKnowledgeArgsSchema.parse(rawArgs);
  const content = await loadKnowledgeBase();

  return {
    query: args.query,
    content,
    source: 'knowledge-markdown',
  };
}
