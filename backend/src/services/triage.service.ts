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

const triageSchema = z.object({
  classificationId: z.string().uuid(),
  classificationReasoning: z.string().trim().min(1),
  workTableId: z.string().uuid(),
  workTableReasoning: z.string().trim().min(1),
  confidence: z.number().min(0).max(1),
});

export type TriageResult = {
  initiativeId: string;
  status: InitiativeStatus;
  isLabScope: boolean;
  confidence: number;
  classification: { id: string; nombre: string; descripcion: string };
  classificationReasoning: string;
  workTable: { id: string; nombre: string; descripcion: string };
  workTableReasoning: string;
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
      impactaPrincipalmenteA: omitEmpty(initiative.impactaA),
      productoRelacionado: omitEmpty(initiative.productoRelacionado),
      beneficiosEsperados: initiative.beneficios.length ? initiative.beneficios : undefined,
      urgencia: initiative.urgencia,
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
  if (!classification) {
    throw new AppError('El triage seleccionó una clasificación inexistente', 502);
  }

  const workTable = workTables.find((item) => item.id === picked.workTableId);
  if (!workTable) {
    throw new AppError('El triage seleccionó una mesa de trabajo inexistente', 502);
  }

  const isLabScope = isLabScopeClassification(classification.nombre);
  const triagedAt = new Date();

  await applyTriageResult(initiative.id, {
    status: isLabScope ? InitiativeStatus.TRIAGED_LAB : InitiativeStatus.TRIAGED_EXTERNAL,
    triageClassificationId: classification.id,
    triageWorkTableId: workTable.id,
    triageReasoning: picked.classificationReasoning,
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
        classificationReasoning: picked.classificationReasoning,
        workTableReasoning: picked.workTableReasoning,
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
    classification: {
      id: classification.id,
      nombre: classification.nombre,
      descripcion: classification.descripcion,
    },
    classificationReasoning: picked.classificationReasoning,
    workTable: {
      id: workTable.id,
      nombre: workTable.nombre,
      descripcion: workTable.descripcion,
    },
    workTableReasoning: picked.workTableReasoning,
    notificationSent,
  };
}
