import { InitiativeStatus, SourceType } from '@prisma/client';
import { z } from 'zod';

/** Comma-separated query values, e.g. ?status=TRIAGED_LAB,REGISTERED */
function csvEnum<T extends Record<string, string>>(enumObject: T) {
  return z
    .string()
    .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
    .pipe(z.array(z.nativeEnum(enumObject)).min(1))
    .optional();
}

export const initiativeFiltersSchema = z.object({
  status: csvEnum(InitiativeStatus),
  sourceType: csvEnum(SourceType),
  triageClassificationId: z.string().uuid().optional(),
  triageWorkTableId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().min(1).max(255).optional(),
});

export type InitiativeFiltersDto = z.infer<typeof initiativeFiltersSchema>;

export const companyContactSchema = z.object({
  empresa: z.string().trim().min(1).max(255),
  contacto: z.string().trim().min(1).max(255),
  cargo: z.string().trim().min(1).max(255),
  correo: z.string().trim().email().max(255),
  telefono: z.string().trim().min(1).max(50),
});

/** Partial fields allowed while initiative is DRAFT (autosave). */
export const draftInitiativeSchema = z.object({
  diligenciadoPor: z.string().trim().max(255).optional(),
  fechaDiligenciamiento: z.coerce.date().optional(),
  expectativaSolucion: z.string().optional(),
  nombre: z.string().trim().max(255).optional(),
  areaProcesoImpactado: z.string().trim().max(255).optional(),
  areaInvolucrada: z.string().trim().max(255).optional(),
  urgencia: z.string().trim().max(100).optional(),
  impacto: z.string().trim().max(500).optional(),
  necesidad: z.string().optional(),
  porQueAhora: z.string().optional(),
  paraQue: z.string().optional(),
  comoSeResuelveHoy: z.string().optional(),
  companyContacts: z.array(companyContactSchema).optional(),
});

export const createInitiativeSchema = draftInitiativeSchema;

export const updateInitiativeSchema = draftInitiativeSchema.extend({
  status: z.nativeEnum(InitiativeStatus).optional(),
});

/** Full validation when registering (DRAFT → REGISTERED). */
export const registerInitiativeSchema = z.object({
  diligenciadoPor: z.string().trim().min(1).max(255),
  fechaDiligenciamiento: z.coerce.date(),
  expectativaSolucion: z.string().trim().min(1),
  nombre: z.string().trim().min(1).max(255),
  areaProcesoImpactado: z.string().trim().min(1).max(255),
  areaInvolucrada: z.string().trim().min(1).max(255),
  urgencia: z.string().trim().min(1).max(100),
  impacto: z.string().trim().min(1).max(500),
  necesidad: z.string().trim().min(1),
  porQueAhora: z.string().trim().min(1),
  paraQue: z.string().trim().min(1),
  comoSeResuelveHoy: z.string().trim().min(1),
  companyContacts: z.array(companyContactSchema).min(1, 'Debe registrar al menos un contacto'),
});

export const initiativeIdParamsSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export const startEvaluationBodySchema = z
  .object({
    mode: z.enum(['interview', 'direct']).optional(),
  })
  .default({});

export type CreateInitiativeDto = z.infer<typeof createInitiativeSchema>;
export type UpdateInitiativeDto = z.infer<typeof updateInitiativeSchema>;
export type RegisterInitiativeDto = z.infer<typeof registerInitiativeSchema>;
export type InitiativeIdParamsDto = z.infer<typeof initiativeIdParamsSchema>;
export type StartEvaluationBodyDto = z.infer<typeof startEvaluationBodySchema>;
export type CompanyContactDto = z.infer<typeof companyContactSchema>;
