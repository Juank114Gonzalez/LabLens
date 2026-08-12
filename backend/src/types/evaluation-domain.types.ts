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

/**
 * Contraste entre lo que decidió el triage al recibir la iniciativa y lo que
 * concluyó la evaluación profunda.
 *
 * Se registra, no se le muestra al modelo: inyectar el veredicto del triage en
 * el contexto de la evaluación la anclaría a coincidir, y se perdería la única
 * señal de control que hay: dos opiniones no correlacionadas sobre el mismo
 * caso. Acumulada, es lo que permite medir la precisión del filtro rápido que
 * el enunciado exige (95%) sin construir a mano un set etiquetado.
 */
export type TriageComparison = {
  /** Falso cuando la iniciativa nunca pasó por triage (p. ej. formulario interno). */
  huboTriage: boolean;
  clasificacionCoincide: boolean | null;
  mesaCoincide: boolean | null;
  triageClassificationNombre: string | null;
  triageWorkTableNombre: string | null;
  triageConfidence: number | null;
};

export type EvaluationResultsPayload = {
  fit: number;
  criteriaScores: CriterionScore[];
  priority: 'Alta' | 'Media' | 'Baja';
  priorityJustification: string;
  classificationJustification: string;
  workTableJustification: string;
  triageComparison?: TriageComparison;
  similarInitiatives?: unknown[];
};

/**
 * Función pura y exportada para poder probarla sin base de datos: es la regla
 * de la que sale la métrica de precisión, así que conviene que no dependa de
 * nada más que sus argumentos.
 */
export function compareWithTriage(
  triage: {
    triageClassificationId: string | null;
    triageWorkTableId: string | null;
    triageConfidence: number | null;
    triagedAt: Date | null;
    triageClassification: { nombre: string } | null;
    triageWorkTable: { nombre: string } | null;
  } | null,
  evaluated: { classificationId: string; workTableId: string },
): TriageComparison {
  // Sin triage previo no hay nada que comparar. Se distingue de "comparado y
  // difirió" a propósito: mezclarlos falsearía la tasa de acierto.
  if (!triage?.triagedAt) {
    return {
      huboTriage: false,
      clasificacionCoincide: null,
      mesaCoincide: null,
      triageClassificationNombre: null,
      triageWorkTableNombre: null,
      triageConfidence: null,
    };
  }

  return {
    huboTriage: true,
    // Nulo cuando el triage mandó la iniciativa a revisión manual: declaró que
    // no podía clasificarla, y eso tampoco es un desacierto.
    clasificacionCoincide: triage.triageClassificationId
      ? triage.triageClassificationId === evaluated.classificationId
      : null,
    mesaCoincide: triage.triageWorkTableId
      ? triage.triageWorkTableId === evaluated.workTableId
      : null,
    triageClassificationNombre: triage.triageClassification?.nombre ?? null,
    triageWorkTableNombre: triage.triageWorkTable?.nombre ?? null,
    triageConfidence: triage.triageConfidence,
  };
}

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
