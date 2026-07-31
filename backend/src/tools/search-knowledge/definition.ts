import type { FunctionDeclaration } from '@google/genai';

export const searchKnowledgeDeclaration: FunctionDeclaration = {
  name: 'searchKnowledge',
  description:
    'Busca información en la documentación del Innovation Lab (criterios, objetivos, tecnologías, políticas). Úsala antes de afirmar reglas o lineamientos del Lab. No inventes contenido.',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Tema o pregunta a consultar en la knowledge base',
      },
    },
    required: ['query'],
  },
};
