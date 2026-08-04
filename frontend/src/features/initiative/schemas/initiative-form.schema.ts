import { z } from 'zod';
import { URGENCY_OPTIONS } from '@/features/initiative/lib/status';

export const contactSchema = z.object({
  empresa: z.string().trim().min(1, 'Empresa requerida'),
  contacto: z.string().trim().min(1, 'Contacto requerido'),
  cargo: z.string().trim().min(1, 'Cargo requerido'),
  correo: z.string().trim().email('Correo inválido'),
  telefono: z.string().trim().min(1, 'Teléfono requerido'),
});

export const initiativeFormSchema = z.object({
  diligenciadoPor: z.string().trim().min(1, 'Requerido'),
  fechaDiligenciamiento: z.string().min(1, 'Requerido'),
  expectativaSolucion: z.string().trim().min(1, 'Requerido'),
  nombre: z.string().trim().min(1, 'Requerido'),
  areaProcesoImpactado: z.string().trim().min(1, 'Requerido'),
  areaInvolucrada: z.string().trim().min(1, 'Requerido'),
  urgencia: z.enum(URGENCY_OPTIONS),
  impacto: z.string().trim().min(1, 'Requerido').max(500),
  necesidad: z.string().trim().min(1, 'Requerido'),
  porQueAhora: z.string().trim().min(1, 'Requerido'),
  paraQue: z.string().trim().min(1, 'Requerido'),
  comoSeResuelveHoy: z.string().trim().min(1, 'Requerido'),
  companyContacts: z.array(contactSchema).min(1, 'Agrega al menos un contacto'),
});

export type InitiativeFormValues = z.infer<typeof initiativeFormSchema>;

/** Schema for draft autosave — fields can be empty while editing. */
export const draftFormSchema = z.object({
  diligenciadoPor: z.string(),
  fechaDiligenciamiento: z.string(),
  expectativaSolucion: z.string(),
  nombre: z.string(),
  areaProcesoImpactado: z.string(),
  areaInvolucrada: z.string(),
  urgencia: z.string(),
  impacto: z.string(),
  necesidad: z.string(),
  porQueAhora: z.string(),
  paraQue: z.string(),
  comoSeResuelveHoy: z.string(),
  companyContacts: z.array(
    z.object({
      empresa: z.string(),
      contacto: z.string(),
      cargo: z.string(),
      correo: z.string(),
      telefono: z.string(),
    }),
  ),
});
