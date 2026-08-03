import type { Content, FunctionCall, Part } from '@google/genai';
import { loadPrompt } from '../prompts/load-prompt.js';
import { executeTool, getToolDeclarations } from '../tools/registry.js';
import type { ChatMessage } from '../types/chat.types.js';
import {
  createEmptyArtifacts,
  type ToolArtifacts,
  type ToolContext,
} from '../types/tools.types.js';
import { AppError } from '../utils/AppError.js';
import { generateWithTools, getResponseParts } from './gemini.service.js';

const MAX_TOOL_ROUNDS = 10;

export type AgentRunResult = {
  message: string;
  artifacts: ToolArtifacts;
};

function toContents(history: ChatMessage[]): Content[] {
  return history
    .filter((item) => item.role === 'user' || item.role === 'assistant')
    .map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    }));
}

function getFunctionCalls(parts: Part[]): FunctionCall[] {
  return parts
    .map((part) => part.functionCall)
    .filter((call): call is FunctionCall => Boolean(call?.name));
}

/**
 * Runs a Gemini agent loop with LabLens tools.
 * Business rules live in tools/services; this layer only orchestrates reasoning.
 */
export async function runLabLensAgent(
  history: ChatMessage[],
  context: ToolContext,
): Promise<AgentRunResult> {
  const systemInstruction = await loadPrompt('system.md');
  const declarations = getToolDeclarations();
  const contents: Content[] = toContents(history);
  const artifacts = createEmptyArtifacts();

  if (contents.length === 0) {
    throw new AppError('Agent history cannot be empty', 400);
  }

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await generateWithTools({
      systemInstruction,
      contents,
      functionDeclarations: declarations,
    });

    const parts = getResponseParts(response);
    const functionCalls = getFunctionCalls(parts);

    if (functionCalls.length === 0) {
      const message = response.text?.trim();
      if (!message) {
        throw new AppError('Gemini returned an empty agent response', 502);
      }

      return { message, artifacts };
    }

    contents.push({
      role: 'model',
      parts,
    });

    const functionResponseParts: Part[] = [];

    for (const call of functionCalls) {
      const args = (call.args ?? {}) as Record<string, unknown>;
      try {
        const result = await executeTool(
          call.name ?? 'unknown',
          args,
          artifacts,
          context,
        );
        functionResponseParts.push({
          functionResponse: {
            name: call.name ?? 'unknown',
            id: call.id,
            response: { result },
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Tool execution failed';
        functionResponseParts.push({
          functionResponse: {
            name: call.name ?? 'unknown',
            id: call.id,
            response: { error: message },
          },
        });
      }
    }

    contents.push({
      role: 'user',
      parts: functionResponseParts,
    });
  }

  throw new AppError('Agent exceeded maximum tool rounds', 502);
}
