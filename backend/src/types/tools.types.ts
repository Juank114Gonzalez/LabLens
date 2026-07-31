import type { FunctionDeclaration } from '@google/genai';
import type { FitResult } from './fit.types.js';
import type { SimilarInitiative } from './initiative.types.js';
import type { ExecutiveSummary } from './summary.types.js';

export type ToolName =
  | 'searchKnowledge'
  | 'findSimilarInitiatives'
  | 'calculateFit'
  | 'generateExecutiveSummary';

export type ToolDefinition = {
  name: ToolName;
  declaration: FunctionDeclaration;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

export type ToolArtifacts = {
  fit: FitResult | null;
  similarInitiatives: SimilarInitiative[];
  summary: ExecutiveSummary | null;
};

export function createEmptyArtifacts(): ToolArtifacts {
  return {
    fit: null,
    similarInitiatives: [],
    summary: null,
  };
}
