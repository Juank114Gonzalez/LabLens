import type { CompanyContact, InitiativeStatus } from '@/features/initiative/types';

export type SourceType = 'INTERNAL' | 'EXTERNAL_CONTRACTOR' | 'INTERNATIONAL_REFERENCE';

/**
 * Formulario público de 12 preguntas. Los campos que solo diligencia el
 * formulario interno (`porQueAhora`, `paraQue`, `comoSeResuelveHoy`,
 * `areaProcesoImpactado`…) no viajan por este canal: Prisma los deja en su
 * default vacío.
 */
export type PublicSubmissionPayload = {
  sourceType: SourceType;
  submitterName: string;
  areaSolicitante: string;
  submitterEmail: string;
  nombre: string;
  necesidad: string;
  solucionPropuesta: string;
  impactaA: string;
  productoRelacionado: string;
  beneficios: string[];
  impacto?: string;
  urgencia: string;
  tieneInteresado: boolean;
  companyContacts: CompanyContact[];
};

export type TriageResult = {
  initiativeId: string;
  status: InitiativeStatus;
  isLabScope: boolean;
  confidence: number;
  classification: { id: string; nombre: string; descripcion: string };
  classificationReasoning: string;
  workTable: { id: string; nombre: string; descripcion: string };
  workTableReasoning: string;
  notificationSent: boolean;
};

export type PublicSubmissionResult = {
  initiative: {
    id: string;
    nombre: string;
    status: InitiativeStatus;
    sourceType: SourceType;
  };
  triage: TriageResult | null;
};
