import { Type } from '@google/genai';
import { listPreviousEvaluationsForInitiative } from '../../repositories/evaluation.repository.js';
import type { ToolDefinition } from '../../types/tools.types.js';

export const getPreviousEvaluationsTool: ToolDefinition = {
  name: 'getPreviousEvaluations',
  declaration: {
    name: 'getPreviousEvaluations',
    description:
      'Obtiene evaluaciones previas completadas de la misma iniciativa (inmutables). Úsalas como contexto histórico, no las recalcules.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  execute: async (_args, context) => {
    const items = await listPreviousEvaluationsForInitiative(context.initiativeId);
    return {
      count: items.length,
      evaluations: items.map((item) => ({
        id: item.id,
        evaluatedAt: item.evaluatedAt,
        priority: item.priority,
        configVersion: item.configVersion,
        results: item.results,
        classification: item.classificationSnapshot,
        workTable: item.workTableSnapshot,
        businessCase: item.businessCase,
        evaluator: item.evaluator,
      })),
    };
  },
};
