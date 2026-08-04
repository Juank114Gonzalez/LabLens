import { z } from 'zod';
import { contactSchema } from '@/features/initiative/schemas/initiative-form.schema';
import { IMPACT_OPTIONS, URGENCY_OPTIONS } from '@/features/initiative/lib/status';

export const SOURCE_TYPES = [
  'INTERNAL',
  'EXTERNAL_CONTRACTOR',
  'INTERNATIONAL_REFERENCE',
] as const;

/** Mirrors backend/src/validators/public-initiative.validator.ts. */
export const publicInitiativeFormSchema = z
  .object({
    sourceType: z.enum(SOURCE_TYPES),
    submitterName: z.string().trim().min(1, 'Requerido'),
    submitterEmail: z.string().trim().email('Correo inválido'),

    diligenciadoPor: z.string().trim().min(1, 'Requerido'),
    fechaDiligenciamiento: z.string().min(1, 'Requerido'),
    expectativaSolucion: z.string().trim().min(1, 'Requerido'),
    nombre: z.string().trim().min(1, 'Requerido'),
    areaProcesoImpactado: z.string().trim().min(1, 'Requerido'),
    areaInvolucrada: z.string().trim().min(1, 'Requerido'),
    urgencia: z.enum(URGENCY_OPTIONS),
    impacto: z.enum(IMPACT_OPTIONS),
    necesidad: z.string().trim().min(1, 'Requerido'),
    porQueAhora: z.string().trim().min(1, 'Requerido'),
    paraQue: z.string().trim().min(1, 'Requerido'),
    comoSeResuelveHoy: z.string().trim().min(1, 'Requerido'),

    referenceOrganization: z.string().trim().optional(),
    referenceEvent: z.string().trim().optional(),
    referenceLink: z.string().trim().optional(),
    referenceRationale: z.string().trim().optional(),

    companyContacts: z.array(contactSchema).min(1, 'Agrega al menos un contacto'),
  })
  .superRefine((value, ctx) => {
    if (value.sourceType !== 'INTERNATIONAL_REFERENCE') {
      return;
    }

    const required = [
      ['referenceOrganization', 'Indica la organización'],
      ['referenceEvent', 'Indica el evento o congreso'],
      ['referenceRationale', 'Explica por qué es un benchmark relevante'],
    ] as const;

    for (const [field, message] of required) {
      if (!value[field]) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
      }
    }

    if (!value.referenceLink) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['referenceLink'],
        message: 'Indica el enlace de referencia',
      });
      return;
    }

    if (!z.string().url().safeParse(value.referenceLink).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['referenceLink'],
        message: 'Debe ser una URL válida',
      });
    }
  });

export type PublicInitiativeFormValues = z.infer<typeof publicInitiativeFormSchema>;
