import type { SimilarInitiative } from './initiative.types.js';
import type { ScoreBreakdown } from './score.types.js';

export type EvaluationResult = {
  summary: string;
  technicalSheet: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  fit: number;
  scores: ScoreBreakdown;
  similarInitiatives: SimilarInitiative[];
};
