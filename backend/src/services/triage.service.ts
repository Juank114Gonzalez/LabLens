import { InitiativeStatus } from '@prisma/client';
import { z } from 'zod';
import { loadPrompt } from '../prompts/load-prompt.js';
import { listClassifications } from '../repositories/classification.repository.js';
import {
  applyTriageResult,
  findInitiativeById,
  markNotificationSent,
} from '../repositories/domain-initiative.repository.js';
import { listWorkTables } from '../repositories/work-table.repository.js';
import { AppError } from '../utils/AppError.js';
import { generatePlainText } from './llm.service.js';
import { notifyWorkTable } from './notification.service.js';

/**
 * Categories the Digital Lab keeps for itself. Anything else is routed out.
 * Compared without accents/case so a renamed-with-typo catalog entry still matches.
 */
const LAB_SCOPE_CLASSIFICATIONS = ['Innovación disruptiva', 'Innovación adyacente'];

/**
 * Por debajo de este umbral la decisión del modelo es, según su propia escala,
 * poco más que una suposición. Enrutar eso a un área le hace perder tiempo, así
 * que se trata igual que un "no clasificable": va a revisión manual.
 */
export const MIN_TRIAGE_CONFIDENCE = 0.4;

const triageSchema = z.object({
  clasificable: z.boolean(),
  classificationId: z.string().uuid().nullable(),
  classificationReasoning: z.string().trim().min(1).nullable(),
  workTableId: z.string().uuid().nullable(),
  workTableReasoning: z.string().trim().min(1).nullable(),
  confidence: z.number().min(0).max(1),
  motivoNoClasificable: z.string().trim().min(1).nullable(),
});

export type TriageResult = {
  initiativeId: string;
  status: InitiativeStatus;
  isLabScope: boolean;
  confidence: number;
  /** Cuando es true no hay clasificación: un evaluador debe revisarla a mano. */
  needsReview: boolean;
  /** Qué le faltó a la iniciativa para poder clasificarse. Solo con needsReview. */
  reviewReason: string | null;
  classification: { id: string; nombre: string; descripcion: string } | null;
  classificationReasoning: string | null;
  workTable: { id: string; nombre: string; descripcion: string } | null;
  workTableReasoning: string | null;
  notificationSent: boolean;
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

function isLabScopeClassification(nombre: string): boolean {
  const normalized = normalize(nombre);
  return LAB_SCOPE_CLASSIFICATIONS.some((item) => normalize(item) === normalized);
}

type TriagePick = z.infer<typeof triageSchema>;

/**
 * Única regla que decide si una iniciativa se enruta automáticamente o pasa a
 * revisión manual. Es una función pura y exportada a propósito: es la lógica que
 * más importa acertar y así puede probarse sin llamar al modelo.
 *
 * Devuelve `null` cuando el triage se puede aplicar tal cual.
 */
export function resolveTriageReview(
  picked: Pick<TriagePick, 'clasificable' | 'confidence' | 'motivoNoClasificable'>,
  catalogPickIsValid: boolean,
): { reason: string } | null {
  // Este caso va PRIMERO a propósito. Cuando el modelo declara que no puede
  // clasificar, devuelve los ids en null — que es exactamente lo que se le pidió.
  // Evaluar antes la validez del catálogo hacía que ese null se leyera como un
  // id inventado y se reportara un motivo falso, culpando al modelo de un fallo
  // que no cometió y ocultando la razón real que sí había explicado.
  if (!picked.clasificable) {
    return {
      reason:
        picked.motivoNoClasificable ??
        'El contenido no permite identificar el problema ni la solución propuesta.',
    };
  }

  if (!catalogPickIsValid) {
    // Aquí sí: el modelo dijo que podía clasificar pero devolvió un id que no
    // existe. Antes esto lanzaba 502 y el usuario perdía el envío; ahora la
    // iniciativa se conserva y la revisa una persona.
    return { reason: 'El triage devolvió una clasificación fuera del catálogo.' };
  }

  if (picked.confidence < MIN_TRIAGE_CONFIDENCE) {
    return {
      reason: `Confianza insuficiente para clasificar automáticamente (${picked.confidence.toFixed(2)}).`,
    };
  }

  return null;
}

function parseTriageJson(raw: string) {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AppError('El modelo devolvió un triage con formato inválido', 502);
  }
  return triageSchema.parse(parsed);
}

function buildCatalog(
  items: Array<{ id: string; nombre: string; descripcion: string; promptContext: string }>,
): string {
  return items
    .map((item) =>
      [
        `- id: ${item.id}`,
        `  nombre: ${item.nombre}`,
        `  descripcion: ${item.descripcion}`,
        `  cuando aplica: ${item.promptContext}`,
      ].join('\n'),
    )
    .join('\n');
}

function buildInitiativeBlock(
  initiative: NonNullable<Awaited<ReturnType<typeof findInitiativeById>>>,
): string {
  // Los dos formularios (público de 12 preguntas e interno) llenan subconjuntos
  // distintos, así que se omite lo vacío: mandarle al modelo una decena de
  // cadenas en blanco solo introduce ruido en la clasificación.
  const omitEmpty = <T,>(value: T | '' | null | undefined): T | undefined =>
    value === '' || value === null || value === undefined ? undefined : value;

  return JSON.stringify(
    {
      nombre: initiative.nombre,
      canalDeOrigen: initiative.sourceType,
      areaDelSolicitante: omitEmpty(initiative.areaSolicitante),
      necesidad: initiative.necesidad,
      solucionPropuesta: omitEmpty(initiative.solucionPropuesta),
      impactaPrincipalmenteA: initiative.impactaA.length ? initiative.impactaA : undefined,
      productosRelacionados: initiative.productoRelacionado.length
        ? initiative.productoRelacionado
        : undefined,
      beneficiosEsperados: initiative.beneficios.length ? initiative.beneficios : undefined,
      urgencia: omitEmpty(initiative.urgencia),
      impacto: omitEmpty(initiative.impacto),
      tieneInteresado: initiative.tieneInteresado ?? undefined,
      expectativaSolucion: omitEmpty(initiative.expectativaSolucion),
      areaProcesoImpactado: omitEmpty(initiative.areaProcesoImpactado),
      areaInvolucrada: omitEmpty(initiative.areaInvolucrada),
      porQueAhora: omitEmpty(initiative.porQueAhora),
      paraQue: omitEmpty(initiative.paraQue),
      comoSeResuelveHoy: omitEmpty(initiative.comoSeResuelveHoy),
      referenciaInternacional: initiative.referenceOrganization
        ? {
            organizacion: initiative.referenceOrganization,
            evento: initiative.referenceEvent,
            link: initiative.referenceLink,
            porQueEsRelevante: initiative.referenceRationale,
          }
        : undefined,
      empresasQueReportanElDolor: initiative.companyContacts.map((contact) => ({
        empresa: contact.empresa,
        cargo: contact.cargo,
      })),
    },
    null,
    2,
  );
}

/**
 * Rapid triage: one LLM call that classifies an initiative and picks its work table.
 * Deliberately independent from `runEvaluationPipeline`, which stays the deep,
 * multi-step scoring path for initiatives that already belong to the Lab.
 */
export async function runTriage(initiativeId: string): Promise<TriageResult> {
  const initiative = await findInitiativeById(initiativeId);
  if (!initiative) {
    throw new AppError('Initiative not found', 404);
  }

  const classifications = (await listClassifications()).filter((item) => item.activo);
  const workTables = (await listWorkTables()).filter((item) => item.activo);

  if (classifications.length === 0) {
    throw new AppError('No hay clasificaciones activas', 409);
  }
  if (workTables.length === 0) {
    throw new AppError('No hay mesas de trabajo activas', 409);
  }

  const template = await loadPrompt('triage.md');
  const prompt = template
    .replace('{{CLASSIFICATIONS}}', buildCatalog(classifications))
    .replace('{{WORK_TABLES}}', buildCatalog(workTables))
    .replace('{{INITIATIVE}}', buildInitiativeBlock(initiative));

  const picked = parseTriageJson(await generatePlainText(prompt));

  const classification = classifications.find((item) => item.id === picked.classificationId);
  const workTable = workTables.find((item) => item.id === picked.workTableId);

  /*
   * Se manda a revisión manual en cuatro casos, no solo cuando el modelo lo pide:
   * también si dudó demasiado, o si devolvió un id que no existe en el catálogo.
   * Antes ese último caso lanzaba un 502 y el usuario perdía el envío; ahora la
   * iniciativa se conserva y la revisa una persona.
   */
  const review = resolveTriageReview(picked, Boolean(classification && workTable));

  if (review) {
    const reviewReason = review.reason;

    await applyTriageResult(initiative.id, {
      status: InitiativeStatus.UNDER_REVIEW,
      triageClassificationId: null,
      triageWorkTableId: null,
      triageReasoning: reviewReason,
      triageConfidence: picked.confidence,
      triagedAt: new Date(),
    });

    // No se notifica a ninguna mesa: enrutar una decisión que el modelo no
    // sostiene le hace perder tiempo al área y erosiona la confianza en el Lab.
    return {
      initiativeId: initiative.id,
      status: InitiativeStatus.UNDER_REVIEW,
      isLabScope: false,
      confidence: picked.confidence,
      needsReview: true,
      reviewReason,
      classification: null,
      classificationReasoning: null,
      workTable: null,
      workTableReasoning: null,
      notificationSent: false,
    };
  }

  // Inalcanzable en la práctica: `brokenCatalogPick` ya retornó arriba. Está para
  // que TypeScript estreche los tipos, que no lo deduce a través del booleano.
  if (!classification || !workTable) {
    throw new AppError('El triage devolvió una clasificación fuera del catálogo', 502);
  }

  const isLabScope = isLabScopeClassification(classification.nombre);
  const triagedAt = new Date();
  const classificationReasoning = picked.classificationReasoning ?? '';
  const workTableReasoning = picked.workTableReasoning ?? '';

  await applyTriageResult(initiative.id, {
    status: isLabScope ? InitiativeStatus.TRIAGED_LAB : InitiativeStatus.TRIAGED_EXTERNAL,
    triageClassificationId: classification.id,
    triageWorkTableId: workTable.id,
    triageReasoning: classificationReasoning,
    triageConfidence: picked.confidence,
    triagedAt,
  });

  let notificationSent = false;

  if (!isLabScope) {
    notificationSent = await notifyWorkTable({
      workTable: { nombre: workTable.nombre, notificationEmail: workTable.notificationEmail },
      initiative: {
        id: initiative.id,
        nombre: initiative.nombre,
        areaProcesoImpactado: initiative.areaProcesoImpactado,
        urgencia: initiative.urgencia,
        impacto: initiative.impacto,
        necesidad: initiative.necesidad,
        porQueAhora: initiative.porQueAhora,
        paraQue: initiative.paraQue,
        submitterName: initiative.submitterName,
        submitterEmail: initiative.submitterEmail,
      },
      triage: {
        classificationName: classification.nombre,
        classificationReasoning,
        workTableReasoning,
        confidence: picked.confidence,
      },
    });

    if (notificationSent) {
      await markNotificationSent(initiative.id, new Date());
    }
  }

  return {
    initiativeId: initiative.id,
    status: isLabScope ? InitiativeStatus.TRIAGED_LAB : InitiativeStatus.TRIAGED_EXTERNAL,
    isLabScope,
    confidence: picked.confidence,
    needsReview: false,
    reviewReason: null,
    classification: {
      id: classification.id,
      nombre: classification.nombre,
      descripcion: classification.descripcion,
    },
    classificationReasoning,
    workTable: {
      id: workTable.id,
      nombre: workTable.nombre,
      descripcion: workTable.descripcion,
    },
    workTableReasoning,
    notificationSent,
  };
}
