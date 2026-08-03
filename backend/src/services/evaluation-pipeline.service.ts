import { z } from 'zod';
import { listClassifications } from '../repositories/classification.repository.js';
import { listCriteria } from '../repositories/criteria.repository.js';
import { findInitiativeById } from '../repositories/domain-initiative.repository.js';
import { listPreviousEvaluationsForInitiative } from '../repositories/evaluation.repository.js';
import { listWorkTables } from '../repositories/work-table.repository.js';
import type { BusinessCase, CriterionScore } from '../types/evaluation-domain.types.js';
import { AppError } from '../utils/AppError.js';
import { persistEvaluationResult } from './evaluation-persistence.service.js';
import { generatePlainText } from './gemini.service.js';

const scoreSchema = z.object({
  score: z.number().min(0).max(100),
  justification: z.string().min(1),
});

const selectionSchema = z.object({
  id: z.string().uuid(),
  justification: z.string().min(1),
});

const prioritySchema = z.object({
  priority: z.enum(['Alta', 'Media', 'Baja']),
  justification: z.string().min(1),
});

const businessCaseSchema = z.object({
  resumenEjecutivo: z.string().min(1),
  objetivosNegocio: z.array(z.string()).min(1),
  beneficiosEstimados: z.array(z.string()).min(1),
  riesgosPrincipales: z.array(z.string()).min(1),
  kpisSugeridos: z.array(z.string()).min(1),
  recomendacionFinal: z.string().min(1),
});

function parseJson<T>(raw: string, schema: z.ZodType<T>): T {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AppError('Failed to parse structured Gemini JSON', 502);
  }
  return schema.parse(parsed);
}

function buildContextPack(input: {
  initiative: NonNullable<Awaited<ReturnType<typeof findInitiativeById>>>;
  transcript: string;
  previousSummary: string;
}) {
  const initiative = input.initiative;
  return [
    '## Iniciativa',
    JSON.stringify(
      {
        id: initiative.id,
        status: initiative.status,
        nombre: initiative.nombre,
        expectativaSolucion: initiative.expectativaSolucion,
        areaProcesoImpactado: initiative.areaProcesoImpactado,
        areaInvolucrada: initiative.areaInvolucrada,
        urgencia: initiative.urgencia,
        impacto: initiative.impacto,
        necesidad: initiative.necesidad,
        porQueAhora: initiative.porQueAhora,
        paraQue: initiative.paraQue,
        comoSeResuelveHoy: initiative.comoSeResuelveHoy,
        companyContacts: initiative.companyContacts,
        attachments: initiative.attachments.map((item) => ({
          originalName: item.originalName,
          mimeType: item.mimeType,
        })),
      },
      null,
      2,
    ),
    '',
    '## Entrevista (si existe)',
    input.transcript || '(Sin entrevista: evaluación directa sobre datos de la iniciativa)',
    '',
    '## Evaluaciones previas (inmutables)',
    input.previousSummary || '(Sin evaluaciones previas)',
  ].join('\n');
}

async function scoreCriterion(input: {
  contextPack: string;
  criterion: {
    id: string;
    nombre: string;
    descripcion: string;
    promptContext: string;
    peso: number;
  };
}): Promise<CriterionScore> {
  const prompt = `Eres un evaluador del Innovation Lab ACH.
Puntúa ÚNICAMENTE el criterio indicado (0-100) con justificación breve.
Responde JSON estricto:
{"score": number, "justification": string}

Criterio: ${input.criterion.nombre}
Descripción: ${input.criterion.descripcion}
PromptContext: ${input.criterion.promptContext}
Peso configurado: ${input.criterion.peso}%

Contexto:
${input.contextPack}`;

  const raw = await generatePlainText(prompt);
  const scored = parseJson(raw, scoreSchema);
  return {
    criteriaId: input.criterion.id,
    nombre: input.criterion.nombre,
    peso: input.criterion.peso,
    score: Math.round(scored.score),
    justification: scored.justification,
  };
}

/**
 * Deterministic evaluation pipeline (Modo Evaluación).
 * LLM only reasons/redacts discrete steps; Fit and persistence are business logic.
 */
export async function runEvaluationPipeline(input: {
  evaluationId: string;
  initiativeId: string;
  transcript?: string;
}) {
  const initiative = await findInitiativeById(input.initiativeId);
  if (!initiative) {
    throw new AppError('Initiative not found', 404);
  }

  const activeCriteria = (await listCriteria())
    .filter((item) => item.activo)
    .sort((a, b) => a.orden - b.orden);

  if (activeCriteria.length === 0) {
    throw new AppError('No hay criterios activos configurados', 409);
  }

  const classifications = (await listClassifications()).filter((item) => item.activo);
  const workTables = (await listWorkTables()).filter((item) => item.activo);

  if (classifications.length === 0) {
    throw new AppError('No hay clasificaciones activas', 409);
  }
  if (workTables.length === 0) {
    throw new AppError('No hay mesas de trabajo activas', 409);
  }

  const previous = await listPreviousEvaluationsForInitiative(input.initiativeId);
  const previousSummary = previous
    .slice(0, 3)
    .map(
      (item) =>
        `- ${item.evaluatedAt?.toISOString() ?? item.createdAt.toISOString()} · prioridad ${item.priority ?? 'n/d'} · config ${item.configVersion ?? 'n/d'}`,
    )
    .join('\n');

  const contextPack = buildContextPack({
    initiative,
    transcript: input.transcript?.trim() ?? '',
    previousSummary,
  });

  // 1) Score each criterion independently (swappable step)
  const criteriaScores = await Promise.all(
    activeCriteria.map((criterion) =>
      scoreCriterion({
        contextPack,
        criterion: {
          id: criterion.id,
          nombre: criterion.nombre,
          descripcion: criterion.descripcion,
          promptContext: criterion.promptContext,
          peso: criterion.peso,
        },
      }),
    ),
  );

  // 2) Classification selection
  const classificationPrompt = `Selecciona UNA clasificación del catálogo. JSON:
{"id":"uuid","justification":"string"}
Catálogo:
${JSON.stringify(
  classifications.map((item) => ({
    id: item.id,
    nombre: item.nombre,
    descripcion: item.descripcion,
    promptContext: item.promptContext,
  })),
)}
Contexto:
${contextPack}
Scores:
${JSON.stringify(criteriaScores.map((item) => ({ nombre: item.nombre, score: item.score })))}`;

  const classificationPick = parseJson(
    await generatePlainText(classificationPrompt),
    selectionSchema,
  );
  if (!classifications.some((item) => item.id === classificationPick.id)) {
    throw new AppError('Clasificación seleccionada inválida', 502);
  }

  // 3) Work table selection
  const workTablePrompt = `Selecciona UNA mesa de trabajo del catálogo. JSON:
{"id":"uuid","justification":"string"}
Catálogo:
${JSON.stringify(
  workTables.map((item) => ({
    id: item.id,
    nombre: item.nombre,
    descripcion: item.descripcion,
    promptContext: item.promptContext,
  })),
)}
Contexto:
${contextPack}
Scores:
${JSON.stringify(criteriaScores.map((item) => ({ nombre: item.nombre, score: item.score })))}`;

  const workTablePick = parseJson(await generatePlainText(workTablePrompt), selectionSchema);
  if (!workTables.some((item) => item.id === workTablePick.id)) {
    throw new AppError('Mesa de trabajo seleccionada inválida', 502);
  }

  // 4) Priority
  const priorityPick = parseJson(
    await generatePlainText(`Define prioridad Alta|Media|Baja. JSON:
{"priority":"Alta"|"Media"|"Baja","justification":"string"}
Contexto:
${contextPack}
Scores:
${JSON.stringify(criteriaScores)}`),
    prioritySchema,
  );

  // 5) Business case (executive)
  const businessCase = parseJson(
    await generatePlainText(`Genera business case ejecutivo breve. JSON:
{
  "resumenEjecutivo": string,
  "objetivosNegocio": string[],
  "beneficiosEstimados": string[],
  "riesgosPrincipales": string[],
  "kpisSugeridos": string[],
  "recomendacionFinal": string
}
Contexto:
${contextPack}
Scores:
${JSON.stringify(criteriaScores)}
Prioridad: ${priorityPick.priority}`),
    businessCaseSchema,
  ) as BusinessCase;

  // 6) Persist (Fit computed in business service)
  const saved = await persistEvaluationResult({
    evaluationId: input.evaluationId,
    initiativeId: input.initiativeId,
    criteriaScores: criteriaScores.map((item) => ({
      criteriaId: item.criteriaId,
      score: item.score,
      justification: item.justification,
    })),
    classificationId: classificationPick.id,
    classificationJustification: classificationPick.justification,
    workTableId: workTablePick.id,
    workTableJustification: workTablePick.justification,
    priority: priorityPick.priority,
    priorityJustification: priorityPick.justification,
    businessCase,
  });

  // 7) Executive report for the conversation (redaction only)
  const report = await generatePlainText(`Redacta un informe ejecutivo breve (máx 180 palabras) en español
para el gestor, con Fit ${saved.fit}, prioridad ${saved.priority},
clasificación ${saved.classification.nombre}, mesa ${saved.workTable.nombre}
y la recomendación final. Sin inventar scores adicionales.`);

  return {
    ...saved,
    report,
  };
}
