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

    // 11
    tieneInteresado: z.boolean({ message: 'Selecciona una opción' }),

    /*
     * Borrador laxo a propósito: las fichas de contacto solo se exigen completas
     * cuando el usuario respondió que sí existe un interesado. Con `contactSchema`
     * directo aquí, una ficha en blanco bloqueaba el envío incluso tras responder
     * "No", y sin mostrar en pantalla cuál era el campo culpable.
     */
    companyContacts: z.array(
      z.object({
        empresa: z.string(),
        contacto: z.string(),
        cargo: z.string(),
        correo: z.string(),
        telefono: z.string(),
      }),
    ),
  })
  .superRefine((value, ctx) => {
    if (!value.tieneInteresado) return;

    if (value.companyContacts.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyContacts'],
        message: 'Agrega al menos un contacto',
      });
      return;
    }

    // Se reutiliza `contactSchema` como única fuente de verdad y se reproyectan
    // sus errores sobre el índice correcto, para que cada input marque el suyo.
    value.companyContacts.forEach((contact, index) => {
      const result = contactSchema.safeParse(contact);
      if (result.success) return;

      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['companyContacts', index, ...issue.path],
          message: issue.message,
        });
      }
    });
  });

export type PublicInitiativeFormValues = z.infer<typeof publicInitiativeFormSchema>;
