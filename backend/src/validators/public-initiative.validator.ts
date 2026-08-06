import { SourceType } from '@prisma/client';
import { z } from 'zod';
import { companyContactSchema } from './initiative.validator.js';

const requiredText = (max?: number) => {
  const base = z.string().trim().min(1);
  return max ? base.max(max) : base;
};

const optionalText = (max: number) => z.string().trim().max(max).optional();

/** Pregunta 7 — opción única. */
export const IMPACT_TARGETS = [
  'Cliente final',
  'Comercio o empresa',
  'Entidad financiera',
  'Colaborador o área interna de ACH',
  'Aliado',
  'Otras',
] as const;

/** Pregunta 8 — opción única. */
export const RELATED_PRODUCTS = [
  'PSE',
  'SOI',
  'ACH en Línea',
  'TESO',
  'Portal de Usuarios',
  'ACH Data',
  'Open Finance',
  'No, es un nuevo producto',
] as const;

/** Pregunta 9 — selección múltiple, opcional. */
export const BENEFIT_OPTIONS = [
  'Nuevos ingresos',
  'Eficiencia operativa',
  'Mejor experiencia',
  'Crecimiento transaccional',
  'Posicionamiento estratégico',
  'Reducción de riesgos',
  'Otras',
] as const;

/** Pregunta 11 — escala 1 a 5, se guarda como texto con su glosa. */
export const URGENCY_LEVELS = [
  '1 - Nada urgente (puede abordarse en más de 12 meses)',
  '2 - Poco urgente (debería abordarse entre 6 y 12 meses)',
  '3 - Urgencia media (debería abordarse entre 3 y 6 meses)',
  '4 - Urgente (debería abordarse entre 1 y 3 meses)',
  '5 - Muy urgente (requiere atención en menos de 1 mes)',
] as const;

/**
 * Envío público (formulario de 12 preguntas).
 *
 * Los campos del formulario interno que este canal no diligencia
 * (`porQueAhora`, `paraQue`, `comoSeResuelveHoy`, `areaProcesoImpactado`…) no
 * aparecen aquí: Prisma los deja en su default vacío. Por eso este validador es
 * independiente del de `initiative.validator.ts` y no comparte requisitos.
 */
export const publicInitiativeSchema = z
  .object({
    // El canal sigue existiendo para no romper la bandeja del Lab ni el triage,
    // pero el formulario ya no lo pregunta: entra por querystring o por default.
    sourceType: z.nativeEnum(SourceType).default(SourceType.INTERNAL),

    // 1, 2, 3 — quién envía
    submitterName: requiredText(255),
    areaSolicitante: requiredText(255),
    submitterEmail: z.string().trim().email().max(255),

    // 4, 5, 6 — la iniciativa
    nombre: requiredText(255),
    necesidad: requiredText(),
    solucionPropuesta: requiredText(),

    // 7, 8 — alcance
    impactaA: z.enum(IMPACT_TARGETS),
    productoRelacionado: z.enum(RELATED_PRODUCTS),

    // 9, 10 — valor esperado (ambas opcionales)
    beneficios: z.array(z.enum(BENEFIT_OPTIONS)).default([]),
    impacto: optionalText(500),

    // 11, 12
    urgencia: z.enum(URGENCY_LEVELS),
    tieneInteresado: z.boolean(),

    // Solo se piden cuando `tieneInteresado` es true.
    companyContacts: z.array(companyContactSchema).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.tieneInteresado && value.companyContacts.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyContacts'],
        message: 'Registre al menos un contacto del cliente, aliado o área interesada',
      });
    }
  });

export type PublicInitiativeDto = z.infer<typeof publicInitiativeSchema>;
