import type { FitResult } from './fit.types.js';
import type { SimilarInitiative } from './initiative.types.js';
import type { BusinessCase, EvaluationReadiness } from './evaluation-domain.types.js';
import type { ExecutiveSummary } from './summary.types.js';

export type ToolName =
  | 'searchKnowledge'
  | 'searchSimilarInitiatives'
  | 'findSimilarInitiatives'
  | 'getInitiative'
  | 'getEvaluationCriteria'
  | 'getPreviousEvaluations'
  | 'getClassifications'
  | 'getWorkTables'
  | 'updateReadiness'
  | 'generateBusinessCase'
  | 'saveEvaluation'
  | 'calculateFit'
  | 'generateExecutiveSummary';

export type ToolContext = {
  evaluationId: string;
  initiativeId: string;
  userId: string;
};

/**
 * Provider-neutral tool shape: plain JSON Schema, no SDK types. Keeps the tool
 * catalog independent of whichever model provider the agent runs on.
 */
export type ToolInputSchema = {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
};

export type ToolDeclaration = {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
};

export type ToolDefinition = {
  name: ToolName;
  declaration: ToolDeclaration;
  execute: (args: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
};

export type ToolArtifacts = {
  fit: FitResult | null;
  similarInitiatives: SimilarInitiative[];
  summary: ExecutiveSummary | null;
  readiness: EvaluationReadiness | null;
  businessCase: BusinessCase | null;
  evaluationSaved: boolean;
};

export function createEmptyArtifacts(): ToolArtifacts {
  return {
    fit: null,
    similarInitiatives: [],
    summary: null,
    readiness: null,
    businessCase: null,
    evaluationSaved: false,
  };
}
