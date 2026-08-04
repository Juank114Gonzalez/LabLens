import { z } from 'zod';
import { loadPrompt } from '../../prompts/load-prompt.js';
import { generatePlainText } from '../../services/llm.service.js';
import type { ExecutiveSummary } from '../../types/summary.types.js';
import { AppError } from '../../utils/AppError.js';
import { generateExecutiveSummaryArgsSchema } from './schema.js';

const summarySchema = z.object({
  problema: z.string().min(1),
  solucionPropuesta: z.string().min(1),
  beneficios: z.array(z.string()).default([]),
  riesgos: z.array(z.string()).default([]),
  siguientePasoRecomendado: z.string().min(1),
});

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const text = fenced?.[1]?.trim() ?? raw;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new AppError('Executive summary is not valid JSON', 502);
  }
  return JSON.parse(text.slice(start, end + 1));
}

export async function executeGenerateExecutiveSummary(
  rawArgs: Record<string, unknown>,
): Promise<ExecutiveSummary> {
  const args = generateExecutiveSummaryArgsSchema.parse(rawArgs);
  const template = await loadPrompt('executive-summary.md');

  const prompt = [
    template,
    '',
    '=== CONTEXTO DE LA INICIATIVA ===',
    args.initiativeContext,
    '',
    '=== FIT ===',
    args.fitJson ?? '(no disponible)',
    '',
    '=== INICIATIVAS SIMILARES ===',
    args.similarInitiativesJson ?? '(no disponible)',
  ].join('\n');

  const raw = await generatePlainText(prompt);
  const parsed = summarySchema.safeParse(extractJson(raw));

  if (!parsed.success) {
    throw new AppError('Executive summary payload has an unexpected shape', 502);
  }

  return parsed.data;
}
