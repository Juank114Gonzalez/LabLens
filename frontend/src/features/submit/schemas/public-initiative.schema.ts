import { z } from 'zod';
import { contactSchema } from '@/features/initiative/schemas/initiative-form.schema';

export const SOURCE_TYPES = [
  'INTERNAL',
  'EXTERNAL_CONTRACTOR',
  'INTERNATIONAL_REFERENCE',
] as const;

/**
 * Catálogo del formulario público de 12 preguntas.
 *
 * Debe permanecer idéntico a `backend/src/validators/public-initiative.validator.ts`:
 * ambos lados validan contra las mismas cadenas literales, así que un cambio de
 * redacción en una opción hay que replicarlo allá o el envío será rechazado.
 */
/** Pregunta 2 — áreas de ACH Colombia. */
export const AREA_OPTIONS = [
  'Operaciones & Tecnología',
  'Comercial',
  'Producto e Innovación',
  'Secretaría de Presidencia',
  'Asuntos Legales',
  'Seguridad & Riesgo',
  'Auditoría',
  'Talento Humano & Administrativa',
  'Planeación',
] as const;

export const IMPACT_TARGETS = [
  'Cliente final',
  'Comercio o empresa',
  'Entidad financiera',
  'Colaborador o área interna de ACH',
  'Aliado',
  'Otras',
] as const;

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

export const BENEFIT_OPTIONS = [
  'Nuevos ingresos',
  'Eficiencia operativa',
  'Mejor experiencia',
  'Crecimiento transaccional',
  'Posicionamiento estratégico',
  'Reducción de riesgos',
  'Otras',
] as const;

export const URGENCY_LEVELS = [
  '1 - Nada urgente (puede abordarse en más de 12 meses)',
  '2 - Poco urgente (debería abordarse entre 6 y 12 meses)',
  '3 - Urgencia media (debería abordarse entre 3 y 6 meses)',
  '4 - Urgente (debería abordarse entre 1 y 3 meses)',
  '5 - Muy urgente (requiere atención en menos de 1 mes)',
] as const;

export const publicInitiativeFormSchema = z
  .object({
    sourceType: z.enum(SOURCE_TYPES),

    // 1, 2, 3
    submitterName: z.string().trim().min(1, 'Requerido'),
    areaSolicitante: z.enum(AREA_OPTIONS, { message: 'Selecciona tu área' }),
    submitterEmail: z.string().trim().email('Correo inválido'),

    // 4, 5, 6
    nombre: z.string().trim().min(1, 'Requerido').max(255),
    necesidad: z.string().trim().min(1, 'Requerido'),
    solucionPropuesta: z.string().trim().min(1, 'Requerido'),

    // 7, 8 — selección múltiple
    impactaA: z.array(z.enum(IMPACT_TARGETS)).min(1, 'Selecciona al menos una opción'),
    productoRelacionado: z
      .array(z.enum(RELATED_PRODUCTS))
      .min(1, 'Selecciona al menos una opción'),

    // 9, 10 — opcionales
    beneficios: z.array(z.enum(BENEFIT_OPTIONS)),
    impacto: z.string().trim().max(500).optional(),

    // 11, 12
    urgencia: z.enum(URGENCY_LEVELS, { message: 'Selecciona un nivel' }),
    tieneInteresado: z.boolean({ message: 'Selecciona una opción' }),

    companyContacts: z.array(contactSchema),
  })
  .superRefine((value, ctx) => {
    // Solo se exige contacto cuando el usuario afirmó que existe un interesado.
    if (value.tieneInteresado && value.companyContacts.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyContacts'],
        message: 'Agrega al menos un contacto',
      });
    }
  });

export type PublicInitiativeFormValues = z.infer<typeof publicInitiativeFormSchema>;
