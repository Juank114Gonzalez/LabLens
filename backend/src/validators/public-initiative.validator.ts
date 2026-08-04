import { SourceType } from '@prisma/client';
import { z } from 'zod';
import { companyContactSchema } from './initiative.validator.js';

const requiredText = (max?: number) => {
  const base = z.string().trim().min(1);
  return max ? base.max(max) : base;
};

/**
 * Public submission: every attribute of section 5.1 of the brief is mandatory
 * regardless of the channel, plus the reference block when the initiative comes
 * from an international benchmark.
 */
export const publicInitiativeSchema = z
  .object({
    sourceType: z.nativeEnum(SourceType),
    submitterName: requiredText(255),
    submitterEmail: z.string().trim().email().max(255),

    diligenciadoPor: requiredText(255),
    fechaDiligenciamiento: z.coerce.date().optional(),
    expectativaSolucion: requiredText(),
    nombre: requiredText(255),
    areaProcesoImpactado: requiredText(255),
    areaInvolucrada: requiredText(255),
    urgencia: requiredText(100),
    impacto: requiredText(100),
    necesidad: requiredText(),
    porQueAhora: requiredText(),
    paraQue: requiredText(),
    comoSeResuelveHoy: requiredText(),

    referenceOrganization: z.string().trim().max(255).optional(),
    referenceEvent: z.string().trim().max(255).optional(),
    referenceLink: z.string().trim().url('referenceLink debe ser una URL válida').optional(),
    referenceRationale: z.string().trim().optional(),

    companyContacts: z
      .array(companyContactSchema)
      .min(1, 'Debe registrar al menos un contacto que reporte el dolor'),
  })
  .superRefine((value, ctx) => {
    if (value.sourceType !== SourceType.INTERNATIONAL_REFERENCE) {
      return;
    }

    const referenceFields = [
      ['referenceOrganization', 'la organización de referencia'],
      ['referenceEvent', 'el evento o congreso'],
      ['referenceLink', 'el enlace de referencia'],
      ['referenceRationale', 'la relevancia como benchmark'],
    ] as const;

    for (const [field, label] of referenceFields) {
      if (!value[field]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `Debe indicar ${label} para una referencia internacional`,
        });
      }
    }
  });

export type PublicInitiativeDto = z.infer<typeof publicInitiativeSchema>;
