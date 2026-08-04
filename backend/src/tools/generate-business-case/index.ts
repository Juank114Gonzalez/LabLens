import { z } from 'zod';
import type { ToolDefinition } from '../../types/tools.types.js';
import { generatePlainText } from '../../services/llm.service.js';
import type { BusinessCase } from '../../types/evaluation-domain.types.js';
import { AppError } from '../../utils/AppError.js';

const businessCaseSchema = z.object({
  resumenEjecutivo: z.string().min(1),
  objetivosNegocio: z.array(z.string()).min(1),
  beneficiosEstimados: z.array(z.string()).min(1),
  riesgosPrincipales: z.array(z.string()).min(1),
  kpisSugeridos: z.array(z.string()).min(1),
  recomendacionFinal: z.string().min(1),
});

export const generateBusinessCaseTool: ToolDefinition = {
  name: 'generateBusinessCase',
  declaration: {
    name: 'generateBusinessCase',
    description:
      'Genera un business case ejecutivo breve a partir del contexto de la entrevista y la iniciativa.',
    inputSchema: {
      type: 'object',
      properties: {
        context: {
          type: 'string',
          description: 'Síntesis del contexto conversado y de la iniciativa.',
        },
      },
      required: ['context'],
    },
  },
  execute: async (args) => {
    const context = String(args.context ?? '');
    if (!context.trim()) {
      throw new AppError('context is required', 400);
    }

    const prompt = `Eres un analista senior del Innovation Lab ACH.
Genera un business case ejecutivo en JSON estricto (sin markdown) con esta forma:
{
  "resumenEjecutivo": string,
  "objetivosNegocio": string[],
  "beneficiosEstimados": string[],
  "riesgosPrincipales": string[],
  "kpisSugeridos": string[],
  "recomendacionFinal": string
}
Sé breve y accionable. Contexto:
${context}`;

    const raw = await generatePlainText(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new AppError('El modelo devolvió un business case con JSON inválido', 502);
    }

    const businessCase = businessCaseSchema.parse(parsed) as BusinessCase;
    return businessCase;
  },
};
