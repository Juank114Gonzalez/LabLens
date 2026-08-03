import { InitiativeStatus } from '@prisma/client';
import { z } from 'zod';

export const companyContactSchema = z.object({
  empresa: z.string().trim().min(1).max(255),
  contacto: z.string().trim().min(1).max(255),
  cargo: z.string().trim().min(1).max(255),
  correo: z.string().trim().email().max(255),
  telefono: z.string().trim().min(1).max(50),
});

export const createInitiativeSchema = z.object({
  diligenciadoPor: z.string().trim().min(1).max(255),
  fechaDiligenciamiento: z.coerce.date(),
  expectativaSolucion: z.string().trim().min(1),
  nombre: z.string().trim().min(1).max(255),
  areaProcesoImpactado: z.string().trim().min(1).max(255),
  areaInvolucrada: z.string().trim().min(1).max(255),
  urgencia: z.string().trim().min(1).max(100),
  impacto: z.string().trim().min(1).max(100),
  necesidad: z.string().trim().min(1),
  porQueAhora: z.string().trim().min(1),
  paraQue: z.string().trim().min(1),
  comoSeResuelveHoy: z.string().trim().min(1),
  status: z.nativeEnum(InitiativeStatus).optional(),
  companyContacts: z.array(companyContactSchema).optional(),
});

export const updateInitiativeSchema = createInitiativeSchema.partial().extend({
  status: z.nativeEnum(InitiativeStatus).optional(),
});

export const initiativeIdParamsSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export type CreateInitiativeDto = z.infer<typeof createInitiativeSchema>;
export type UpdateInitiativeDto = z.infer<typeof updateInitiativeSchema>;
export type InitiativeIdParamsDto = z.infer<typeof initiativeIdParamsSchema>;
export type CompanyContactDto = z.infer<typeof companyContactSchema>;
