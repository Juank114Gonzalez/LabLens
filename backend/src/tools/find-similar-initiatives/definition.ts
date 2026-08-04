import type { ToolDeclaration } from '../../types/tools.types.js';

export const findSimilarInitiativesDeclaration: ToolDeclaration = {
  name: 'findSimilarInitiatives',
  description:
    'Busca iniciativas históricas similares (mock JSON). Úsala para contextualizar recomendaciones con casos previos. Máximo 5 resultados.',
  inputSchema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'Texto o resumen de la iniciativa actual',
      },
      limit: {
        type: 'number',
        description: 'Cantidad máxima de resultados (1-5)',
      },
    },
    required: ['description'],
  },
};
