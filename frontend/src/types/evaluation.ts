export type ReadinessStatus = 'INSUFFICIENT' | 'IN_PROGRESS' | 'READY';

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
 * Contraste entre el triage rápido y la evaluación profunda. Acumulado, es la
 * medición de precisión del filtro que pide el enunciado; por evaluación, le
 * avisa al gestor de que ese caso merece una segunda mirada.
 */
export type TriageComparison = {
  huboTriage: boolean;
  clasificacionCoincide: boolean | null;
  mesaCoincide: boolean | null;
  triageClassificationNombre: string | null;
  triageWorkTableNombre: string | null;
  triageConfidence: number | null;
};

export type EvaluationResult = {
  id: string;
  status: string;
  readinessStatus: ReadinessStatus;
  readiness: EvaluationReadiness | null;
  fit: number | null;
  priority: string | null;
  priorityJustification: string | null;
  criteriaScores: CriterionScore[];
  /** Versión compartida de la configuración de criterios con la que se puntuó. */
  criteriaVersion: { numero: number; createdAt: string } | null;
  /** Nulo en evaluaciones cerradas antes de que esto se registrara. */
  triageComparison: TriageComparison | null;
  classification: {
    id: string;
    nombre: string;
    descripcion: string;
    justification: string | null;
  } | null;
  workTable: {
    id: string;
    nombre: string;
    descripcion: string;
    justification: string | null;
  } | null;
  businessCase: BusinessCase | null;
  recommendations: string[];
  configVersion: string | null;
  evaluatedAt: string | null;
  createdAt: string;
  initiative: {
    id: string;
    nombre: string;
    companyContacts: Array<{
      empresa: string;
      contacto: string;
      cargo?: string;
      correo?: string;
    }>;
    attachments: Array<{
      id: string;
      originalName: string;
      mimeType: string;
      size: number;
      secureUrl: string;
    }>;
    expectativaSolucion?: string | null;
    urgencia?: string | null;
    impacto?: string | null;
    necesidad?: string | null;
  } | null;
  conversationId: string | null;
  export: {
    pdf: 'planned';
    word: 'planned';
  };
};
