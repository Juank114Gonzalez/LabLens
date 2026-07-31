import type { SimilarInitiative } from './initiative.types.js';
import type { FitResult } from './fit.types.js';
import type { ExecutiveSummary } from './summary.types.js';

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type SimilarInitiativeView = SimilarInitiative;

export type AgentChatData = {
  message: string;
  fit: FitResult | null;
  similarInitiatives: SimilarInitiativeView[];
  summary: ExecutiveSummary | null;
};

/** Re-export alias used by similarity tool consumers. */
export type { SimilarInitiative };
