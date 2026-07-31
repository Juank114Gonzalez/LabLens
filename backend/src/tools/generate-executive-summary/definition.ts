import type { FunctionDeclaration } from '@google/genai';

export const generateExecutiveSummaryDeclaration: FunctionDeclaration = {
  name: 'generateExecutiveSummary',
  description:
    'Genera un resumen ejecutivo estructurado (problema, solución, beneficios, riesgos, siguiente paso). Úsala cuando ya tengas contexto suficiente y, preferiblemente, Fit + similares.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      initiativeContext: {
        type: 'string',
        description: 'Contexto consolidado de la iniciativa',
      },
      fitJson: {
        type: 'string',
        description: 'JSON del Fit si ya fue calculado',
      },
      similarInitiativesJson: {
        type: 'string',
        description: 'JSON de iniciativas similares si ya fueron consultadas',
      },
    },
    required: ['initiativeContext'],
  },
};
