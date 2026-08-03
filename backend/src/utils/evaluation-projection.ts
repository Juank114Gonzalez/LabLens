import type { Evaluation } from '@prisma/client';
import type { EvaluationResult } from '../types/evaluation.types.js';

export function projectEvaluation(
  evaluation: Evaluation | null | undefined,
): EvaluationResult | null {
  if (!evaluation) {
    return null;
  }

  const recommendations = Array.isArray(evaluation.recommendations)
    ? (evaluation.recommendations as string[])
    : [];

  return {
    summary: evaluation.summary,
    technicalSheet: evaluation.summary,
    strengths: [],
    weaknesses: [],
    recommendations,
    fit: evaluation.fit,
    scores: {
      fit: evaluation.fit,
      impact: evaluation.impact,
      data: evaluation.dataAvailability,
      complexity: evaluation.complexity,
      alignment: evaluation.alignment,
    },
    similarInitiatives: [],
  };
}
