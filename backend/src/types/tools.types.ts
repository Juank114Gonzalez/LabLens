import type { FunctionDeclaration } from '@google/genai';
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

export type ToolDefinition = {
  name: ToolName;
  declaration: FunctionDeclaration;
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
