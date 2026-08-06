/**
 * RAG retrieval contract for Lente de Innovación.
 * Current implementation can stay markdown/mock; swap this module for pgvector later
 * without changing tool names (`searchKnowledge`).
 */
export type KnowledgeChunk = {
  id: string;
  content: string;
  source: string;
  score?: number;
};

export type KnowledgeRetriever = {
  retrieve(query: string, limit?: number): Promise<KnowledgeChunk[]>;
};

/** Placeholder until vector store is wired. */
export class StubKnowledgeRetriever implements KnowledgeRetriever {
  async retrieve(query: string, limit = 5): Promise<KnowledgeChunk[]> {
    return [
      {
        id: 'stub',
        content: `RAG stub for query: ${query}. Replace with embedding search.`,
        source: 'stub',
        score: 0,
      },
    ].slice(0, limit);
  }
}
