import type { CompanyContact, InitiativeStatus } from '@/features/initiative/types';

export type SourceType = 'INTERNAL' | 'EXTERNAL_CONTRACTOR' | 'INTERNATIONAL_REFERENCE';

export type PublicSubmissionPayload = {
  sourceType: SourceType;
  submitterName: string;
  submitterEmail: string;
  diligenciadoPor: string;
  fechaDiligenciamiento: string;
  expectativaSolucion: string;
  nombre: string;
  areaProcesoImpactado: string;
  areaInvolucrada: string;
  urgencia: string;
  impacto: string;
  necesidad: string;
  porQueAhora: string;
  paraQue: string;
  comoSeResuelveHoy: string;
  referenceOrganization?: string;
  referenceEvent?: string;
  referenceLink?: string;
  referenceRationale?: string;
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
