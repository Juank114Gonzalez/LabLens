import {
  GoogleGenAI,
  type Content,
  type FunctionDeclaration,
  type GenerateContentResponse,
  type Part,
} from '@google/genai';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

function extractGeminiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Failed to generate content with Gemini';
  }

  try {
    const parsed: unknown = JSON.parse(error.message);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'error' in parsed &&
      typeof (parsed as { error?: { message?: unknown } }).error?.message === 'string'
    ) {
      return (parsed as { error: { message: string } }).error.message;
    }
  } catch {
    // not JSON
  }

  return error.message || 'Failed to generate content with Gemini';
}

function wrapGeminiError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }

  const details = extractGeminiErrorMessage(error);

  if (env.NODE_ENV !== 'production') {
    console.error('[GeminiService]', details);
    throw new AppError(`Failed to generate content with Gemini: ${details}`, 502);
  }

  throw new AppError('Failed to generate content with Gemini', 502);
}

/** Plain text generation for focused tools (e.g. executive summary). */
export async function generatePlainText(prompt: string): Promise<string> {
  try {
    const response = await client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
    });

    const text = response.text?.trim();
    if (!text) {
      throw new AppError('Gemini returned an empty response', 502);
    }

    return text;
  } catch (error) {
    wrapGeminiError(error);
  }
}

/** One model turn with tools enabled (manual function-calling loop). */
export async function generateWithTools(input: {
  systemInstruction: string;
  contents: Content[];
  functionDeclarations: FunctionDeclaration[];
}): Promise<GenerateContentResponse> {
  try {
    return await client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: input.contents,
      config: {
        systemInstruction: input.systemInstruction,
        tools: [{ functionDeclarations: input.functionDeclarations }],
      },
    });
  } catch (error) {
    wrapGeminiError(error);
  }
}

export function getResponseParts(response: GenerateContentResponse): Part[] {
  return response.candidates?.[0]?.content?.parts ?? [];
}
