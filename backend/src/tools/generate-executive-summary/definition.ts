import type { ToolDeclaration } from '../../types/tools.types.js';

export const generateExecutiveSummaryDeclaration: ToolDeclaration = {
  name: 'generateExecutiveSummary',
  description:
    'Genera un resumen ejecutivo estructurado (problema, solución, beneficios, riesgos, siguiente paso). Úsala cuando ya tengas contexto suficiente y, preferiblemente, Fit + similares.',
  inputSchema: {
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
