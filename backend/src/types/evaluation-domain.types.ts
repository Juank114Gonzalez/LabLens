export type EvaluationReadiness = {
  problemUnderstanding: boolean;
  expectedValue: boolean;
  organizationalContext: boolean;
  scope: boolean;
  risks: boolean;
  dependencies: boolean;
  sufficientInformation: boolean;
  notes?: string;
};

export type CriterionScore = {
  criteriaId: string;
  nombre: string;
  peso: number;
  score: number;
  justification: string;
};

export type BusinessCase = {
  resumenEjecutivo: string;
  objetivosNegocio: string[];
  beneficiosEstimados: string[];
  riesgosPrincipales: string[];
  kpisSugeridos: string[];
  recomendacionFinal: string;
};

export type EvaluationResultsPayload = {
  fit: number;
  criteriaScores: CriterionScore[];
  priority: 'Alta' | 'Media' | 'Baja';
  priorityJustification: string;
  classificationJustification: string;
  workTableJustification: string;
  similarInitiatives?: unknown[];
};

export function readinessLabel(
  readiness: EvaluationReadiness,
): 'INSUFFICIENT' | 'IN_PROGRESS' | 'READY' {
  const flags = [
    readiness.problemUnderstanding,
    readiness.expectedValue,
    readiness.organizationalContext,
    readiness.scope,
    readiness.risks,
    readiness.dependencies,
    readiness.sufficientInformation,
  ];
  const readyCount = flags.filter(Boolean).length;
  if (readyCount === flags.length) return 'READY';
  if (readyCount === 0) return 'INSUFFICIENT';
  return 'IN_PROGRESS';
}

export function computeWeightedFit(scores: CriterionScore[]): number {
  const totalWeight = scores.reduce((sum, item) => sum + item.peso, 0);
  if (totalWeight <= 0) return 0;
  const weighted = scores.reduce((sum, item) => sum + item.score * item.peso, 0);
  return Math.round(weighted / totalWeight);
}
