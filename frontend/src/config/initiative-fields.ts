import type { InitiativeDataField } from '@/types/initiative';

export type FieldMeta = {
  key: InitiativeDataField;
  label: string;
  weighted: boolean;
};

/** Mirrors backend completion weights / interview checklist. */
export const INITIATIVE_FIELD_META: FieldMeta[] = [
  { key: 'title', label: 'Nombre', weighted: false },
  { key: 'problem', label: 'Problema', weighted: true },
  { key: 'objective', label: 'Objetivo', weighted: true },
  { key: 'businessArea', label: 'Área de negocio', weighted: true },
  { key: 'sponsor', label: 'Sponsor', weighted: true },
  { key: 'affectedUsers', label: 'Usuarios afectados', weighted: true },
  { key: 'expectedBenefit', label: 'Beneficio esperado', weighted: true },
  { key: 'availableData', label: 'Datos disponibles', weighted: true },
  { key: 'stakeholders', label: 'Stakeholders', weighted: true },
  { key: 'dependencies', label: 'Dependencias', weighted: true },
  { key: 'risks', label: 'Riesgos', weighted: true },
  { key: 'technologies', label: 'Tecnologías', weighted: true },
  { key: 'estimatedTimeline', label: 'Timeline', weighted: true },
  { key: 'additionalComments', label: 'Comentarios', weighted: false },
];
