import { z } from 'zod';
import { persistEvaluationResult } from '../../services/evaluation-persistence.service.js';
import type { ToolDefinition } from '../../types/tools.types.js';

const saveSchema = z.object({
  criteriaScores: z
    .array(
      z.object({
        criteriaId: z.string().uuid(),
        score: z.number().min(0).max(100),
        justification: z.string().min(1),
      }),
    )
    .min(1),
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

/** Kept for tooling compatibility; Modo Evaluación usa el pipeline de servicio. */
export const saveEvaluationTool: ToolDefinition = {
  name: 'saveEvaluation',
  declaration: {
    name: 'saveEvaluation',
    description:
      'Persiste la evaluación final. El Fit se calcula en backend. Preferir el pipeline de evaluación.',
    inputSchema: {
      type: 'object',
      properties: {
        criteriaScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criteriaId: { type: 'string' },
              score: { type: 'number' },
              justification: { type: 'string' },
            },
            required: ['criteriaId', 'score', 'justification'],
          },
        },
        classificationId: { type: 'string' },
        classificationJustification: { type: 'string' },
        workTableId: { type: 'string' },
        workTableJustification: { type: 'string' },
        priority: { type: 'string' },
        priorityJustification: { type: 'string' },
        businessCase: {
          type: 'object',
          properties: {
            resumenEjecutivo: { type: 'string' },
            objetivosNegocio: { type: 'array', items: { type: 'string' } },
            beneficiosEstimados: { type: 'array', items: { type: 'string' } },
            riesgosPrincipales: { type: 'array', items: { type: 'string' } },
            kpisSugeridos: { type: 'array', items: { type: 'string' } },
            recomendacionFinal: { type: 'string' },
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
          type: 'array',
          items: { type: 'string' },
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
    const saved = await persistEvaluationResult({
      evaluationId: context.evaluationId,
      initiativeId: context.initiativeId,
      ...input,
    });
    return {
      saved: true,
      evaluationId: saved.evaluationId,
      fit: saved.fit,
      priority: saved.priority,
      classification: saved.classification.nombre,
      workTable: saved.workTable.nombre,
    };
  },
};
