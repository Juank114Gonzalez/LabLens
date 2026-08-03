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

export type EvaluationResult = {
  id: string;
  status: string;
  readinessStatus: ReadinessStatus;
  readiness: EvaluationReadiness | null;
  fit: number | null;
  priority: string | null;
  priorityJustification: string | null;
  criteriaScores: CriterionScore[];
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
