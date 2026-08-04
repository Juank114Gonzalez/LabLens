import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

/**
 * Caps thinking plus response text together. The prompts here ask for compact
 * JSON, so the budget exists mostly to leave the model room to reason.
 */
export const MAX_TOKENS = 16000;

function extractErrorMessage(error: unknown): string {
  if (error instanceof Anthropic.APIError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message || 'Failed to generate content';
  }
  return 'Failed to generate content';
}

export function wrapLlmError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }

  const details = extractErrorMessage(error);

  if (env.NODE_ENV !== 'production') {
    console.error('[LlmService]', details);
    throw new AppError(`Failed to generate content: ${details}`, 502);
  }

  throw new AppError('Failed to generate content', 502);
}

/**
 * Safety classifiers can decline a request with a normal 200 response, so the
 * stop reason has to be checked before reading content.
 */
export function assertNotRefused(stopReason: string | null): void {
  if (stopReason === 'refusal') {
    throw new AppError('El modelo declinó procesar esta solicitud', 502);
  }
}

/** Plain text generation for focused steps (triage, scoring, business case). */
export async function generatePlainText(prompt: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }],
    });

    assertNotRefused(response.stop_reason);

    // Thinking blocks come before the answer; only text blocks carry the output.
    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    if (!text) {
      throw new AppError('El modelo devolvió una respuesta vacía', 502);
    }

    return text;
  } catch (error) {
    wrapLlmError(error);
  }
}
