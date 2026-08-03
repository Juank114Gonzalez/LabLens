export type InitiativeStatus =
  | 'DRAFT'
  | 'REGISTERED'
  | 'UNDER_REVIEW'
  | 'EVALUATED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

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
  userId: string;
  status: InitiativeStatus;
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
  createdAt: string;
  updatedAt: string;
  companyContacts: CompanyContact[];
  attachments: Attachment[];
  evaluations: EvaluationSummary[];
  user?: { id: string; name: string; email: string };
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
