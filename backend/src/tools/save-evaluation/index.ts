import { Type } from '@google/genai';
import {
  ConversationStatus,
  EvaluationStatus,
  InitiativeStatus,
  Prisma,
} from '@prisma/client';
import { z } from 'zod';
import { listClassifications } from '../../repositories/classification.repository.js';
import { listCriteria } from '../../repositories/criteria.repository.js';
import { updateConversation } from '../../repositories/conversation.repository.js';
import {
  getEvaluationOrThrow,
  updateEvaluation,
} from '../../repositories/evaluation.repository.js';
import { updateInitiative } from '../../repositories/domain-initiative.repository.js';
import { listWorkTables } from '../../repositories/work-table.repository.js';
import {
  computeWeightedFit,
  type BusinessCase,
  type CriterionScore,
  type EvaluationResultsPayload,
} from '../../types/evaluation-domain.types.js';
import type { ToolDefinition } from '../../types/tools.types.js';
import { AppError } from '../../utils/AppError.js';

const saveSchema = z.object({
  criteriaScores: z.array(
    z.object({
      criteriaId: z.string().uuid(),
      score: z.number().min(0).max(100),
      justification: z.string().min(1),
    }),
  ).min(1),
  classificationId: z.string().uuid(),
  classificationJustification: z.string().min(1),
  workTableId: z.string().uuid(),
  workTableJustification: z.string().min(1),
  priority: z.enum(['Alta', 'Media', 'Baja']),
  priorityJustification: z.string().min(1),
  businessCase: z.object({
    resumenEjecutivo: z.string().min(1),
    objetivosNegocio: z.array(z.string()).min(1),
    beneficiosEstimados: z.array(z.string()).min(1),
    riesgosPrincipales: z.array(z.string()).min(1),
    kpisSugeridos: z.array(z.string()).min(1),
    recomendacionFinal: z.string().min(1),
  }),
  recommendations: z.array(z.string()).optional(),
});

export const saveEvaluationTool: ToolDefinition = {
  name: 'saveEvaluation',
  declaration: {
    name: 'saveEvaluation',
    description:
      'Persiste la evaluación final. El Fit se calcula en backend con los pesos activos. No inventes IDs: usa getEvaluationCriteria y catálogos reales.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        criteriaScores: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              criteriaId: { type: Type.STRING },
              score: { type: Type.NUMBER },
              justification: { type: Type.STRING },
            },
            required: ['criteriaId', 'score', 'justification'],
          },
        },
        classificationId: { type: Type.STRING },
        classificationJustification: { type: Type.STRING },
        workTableId: { type: Type.STRING },
        workTableJustification: { type: Type.STRING },
        priority: { type: Type.STRING },
        priorityJustification: { type: Type.STRING },
        businessCase: {
          type: Type.OBJECT,
          properties: {
            resumenEjecutivo: { type: Type.STRING },
            objetivosNegocio: { type: Type.ARRAY, items: { type: Type.STRING } },
            beneficiosEstimados: { type: Type.ARRAY, items: { type: Type.STRING } },
            riesgosPrincipales: { type: Type.ARRAY, items: { type: Type.STRING } },
            kpisSugeridos: { type: Type.ARRAY, items: { type: Type.STRING } },
            recomendacionFinal: { type: Type.STRING },
          },
          required: [
            'resumenEjecutivo',
            'objetivosNegocio',
            'beneficiosEstimados',
            'riesgosPrincipales',
            'kpisSugeridos',
            'recomendacionFinal',
          ],
        },
        recommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: [
        'criteriaScores',
        'classificationId',
        'classificationJustification',
        'workTableId',
        'workTableJustification',
        'priority',
        'priorityJustification',
        'businessCase',
      ],
    },
  },
  execute: async (args, context) => {
    const input = saveSchema.parse(args);
    const evaluation = await getEvaluationOrThrow(context.evaluationId);

    if (evaluation.status === EvaluationStatus.COMPLETED) {
      throw new AppError('Evaluation already completed and immutable', 409);
    }

    const activeCriteria = (await listCriteria()).filter((item) => item.activo);
    const classifications = await listClassifications();
    const workTables = await listWorkTables();

    const classification = classifications.find((item) => item.id === input.classificationId && item.activo);
    const workTable = workTables.find((item) => item.id === input.workTableId && item.activo);

    if (!classification) {
      throw new AppError('Invalid classificationId', 400);
    }
    if (!workTable) {
      throw new AppError('Invalid workTableId', 400);
    }

    const criteriaScores: CriterionScore[] = input.criteriaScores.map((score) => {
      const criterion = activeCriteria.find((item) => item.id === score.criteriaId);
      if (!criterion) {
        throw new AppError(`Unknown or inactive criteriaId: ${score.criteriaId}`, 400);
      }
      return {
        criteriaId: criterion.id,
        nombre: criterion.nombre,
        peso: criterion.peso,
        score: score.score,
        justification: score.justification,
      };
    });

    if (criteriaScores.length !== activeCriteria.length) {
      throw new AppError('Debes puntuar todos los criterios activos', 400);
    }

    const fit = computeWeightedFit(criteriaScores);
    const businessCase = input.businessCase as BusinessCase;

    const results: EvaluationResultsPayload = {
      fit,
      criteriaScores,
      priority: input.priority,
      priorityJustification: input.priorityJustification,
      classificationJustification: input.classificationJustification,
      workTableJustification: input.workTableJustification,
    };

    const weightsSnapshot = Object.fromEntries(
      criteriaScores.map((item) => [item.criteriaId, item.peso]),
    );

    await updateEvaluation(context.evaluationId, {
      status: EvaluationStatus.COMPLETED,
      results: results as unknown as Prisma.InputJsonValue,
      criteriaSnapshot: activeCriteria as unknown as Prisma.InputJsonValue,
      weightsSnapshot: weightsSnapshot as unknown as Prisma.InputJsonValue,
      classificationSnapshot: classification as unknown as Prisma.InputJsonValue,
      workTableSnapshot: workTable as unknown as Prisma.InputJsonValue,
      classification: { connect: { id: classification.id } },
      workTable: { connect: { id: workTable.id } },
      businessCase: JSON.stringify(businessCase),
      recommendations: (input.recommendations ?? [
        businessCase.recomendacionFinal,
      ]) as unknown as Prisma.InputJsonValue,
      priority: input.priority,
      evaluatedAt: new Date(),
      configVersion: evaluation.configVersion ?? new Date().toISOString(),
    });

    if (evaluation.conversation) {
      await updateConversation(evaluation.conversation.id, {
        status: ConversationStatus.COMPLETED,
        completion: 100,
      });
    }

    await updateInitiative(context.initiativeId, {
      status: InitiativeStatus.EVALUATED,
    });

    return {
      saved: true,
      evaluationId: context.evaluationId,
      fit,
      priority: input.priority,
      classification: classification.nombre,
      workTable: workTable.nombre,
    };
  },
};
