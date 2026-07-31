import type { FunctionDeclaration } from '@google/genai';

export const calculateFitDeclaration: FunctionDeclaration = {
  name: 'calculateFit',
  description:
    'Calcula el Fit (0-100) con un motor determinístico del backend. Nunca inventes este número: siempre llama esta herramienta cuando vayas a hablar de Fit. Úsala solo si hay información suficiente de la iniciativa.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      initiativeDescription: {
        type: 'string',
        description:
          'Texto consolidado con problema, objetivo, datos, sponsor, beneficios y contexto relevante',
      },
    },
    required: ['initiativeDescription'],
  },
};
