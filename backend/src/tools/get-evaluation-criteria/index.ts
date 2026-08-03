import { Type } from '@google/genai';
import { listCriteria } from '../../repositories/criteria.repository.js';
import type { ToolDefinition } from '../../types/tools.types.js';

export const getEvaluationCriteriaTool: ToolDefinition = {
  name: 'getEvaluationCriteria',
  declaration: {
    name: 'getEvaluationCriteria',
    description:
      'Obtiene los criterios de evaluación activos con peso, descripción y promptContext. Úsalos para puntuar la iniciativa.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  execute: async () => {
    const criteria = await listCriteria();
    const active = criteria.filter((item) => item.activo).sort((a, b) => a.orden - b.orden);
    return {
      count: active.length,
      totalWeight: active.reduce((sum, item) => sum + item.peso, 0),
      criteria: active.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion,
        promptContext: item.promptContext,
        peso: item.peso,
        orden: item.orden,
      })),
    };
  },
};
