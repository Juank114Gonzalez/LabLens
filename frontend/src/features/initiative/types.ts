export type InitiativeStatus =
  | 'DRAFT'
  | 'REGISTERED'
  | 'TRIAGED_LAB'
  | 'TRIAGED_EXTERNAL'
  | 'UNDER_REVIEW'
  | 'EVALUATED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export type SourceType = 'INTERNAL' | 'EXTERNAL_CONTRACTOR' | 'INTERNATIONAL_REFERENCE';

export type CompanyContact = {
  id?: string;
  empresa: string;
  contacto: string;
  cargo: string;
  correo: string;
  telefono: string;
};

export type Attachment = {
  id: string;
  publicId: string;
  secureUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type EvaluationSummary = {
  id: string;
  status: string;
  results: unknown;
  criteriaSnapshot: unknown;
  classificationSnapshot: unknown;
  workTableSnapshot: unknown;
  evaluatedAt: string | null;
  createdAt: string;
  evaluator?: { id: string; name: string; email: string } | null;
  classification?: { id: string; nombre: string } | null;
  workTable?: { id: string; nombre: string } | null;
};

export type DomainInitiative = {
  id: string;
  userId: string | null;
  status: InitiativeStatus;
  sourceType: SourceType;
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
  // Formulario público. El interno los deja en su default vacío, así que la
  // vista de detalle los oculta cuando no vienen en lugar de pintar guiones.
  areaSolicitante: string;
  solucionPropuesta: string;
  impactaA: string[];
  productoRelacionado: string[];
  beneficios: string[];
  tieneInteresado: boolean | null;
  referenceOrganization: string | null;
  referenceEvent: string | null;
  referenceLink: string | null;
  referenceRationale: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  /** No nulo si esta iniciativa es copia de otra. */
  copiedFromId: string | null;
  triageReasoning: string | null;
  triageConfidence: number | null;
  triagedAt: string | null;
  notificationSentAt: string | null;
  createdAt: string;
  updatedAt: string;
  companyContacts: CompanyContact[];
  attachments: Attachment[];
  evaluations: EvaluationSummary[];
  user?: { id: string; name: string; email: string } | null;
  triageClassification?: { id: string; nombre: string } | null;
  triageWorkTable?: { id: string; nombre: string; notificationEmail: string | null } | null;
};

export type InitiativeDraftPayload = {
  diligenciadoPor?: string;
  fechaDiligenciamiento?: string;
  expectativaSolucion?: string;
  nombre?: string;
  areaProcesoImpactado?: string;
  areaInvolucrada?: string;
  urgencia?: string;
  impacto?: string;
  necesidad?: string;
  porQueAhora?: string;
  paraQue?: string;
  comoSeResuelveHoy?: string;
  companyContacts?: CompanyContact[];
};
