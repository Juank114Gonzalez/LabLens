import type { FunctionDeclaration } from '@google/genai';

export const findSimilarInitiativesDeclaration: FunctionDeclaration = {
  name: 'findSimilarInitiatives',
  description:
    'Busca iniciativas históricas similares (mock JSON). Úsala para contextualizar recomendaciones con casos previos. Máximo 5 resultados.',
  parametersJsonSchema: {
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
