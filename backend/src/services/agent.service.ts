import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema';
import { env } from '../config/env.js';
import { loadPrompt } from '../prompts/load-prompt.js';
import { executeTool, getToolDeclarations, type AgentToolMode } from '../tools/registry.js';
import type { ChatMessage } from '../types/chat.types.js';
import {
  createEmptyArtifacts,
  type ToolArtifacts,
  type ToolContext,
} from '../types/tools.types.js';
import { AppError } from '../utils/AppError.js';
import {
  anthropic,
  assertNotRefused,
  MAX_TOKENS,
  thinkingConfig,
  wrapLlmError,
} from './llm.service.js';

const MAX_TOOL_ROUNDS = 8;

export type AgentRunResult = {
  message: string;
  artifacts: ToolArtifacts;
};

function toMessages(history: ChatMessage[]) {
  return history
    .filter((item) => item.role === 'user' || item.role === 'assistant')
    .map((item) => ({
      role: item.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: item.content,
    }));
}

/**
 * Modo Entrevista: el agente solo conversa y consulta contexto.
 * La evaluación corre en evaluation-pipeline.service (fuera de este loop).
 */
export async function runInterviewAgent(
  history: ChatMessage[],
  context: ToolContext,
): Promise<AgentRunResult> {
  const mode: AgentToolMode = 'interview';
  const system = await loadPrompt('system.md');
  const messages = toMessages(history);
  const artifacts = createEmptyArtifacts();

  if (messages.length === 0) {
    throw new AppError('Agent history cannot be empty', 400);
  }

  // Built per run so each tool call records its artifacts against the
  // conversation that produced it.
  const tools = getToolDeclarations(mode).map((declaration) =>
    betaTool({
      name: declaration.name,
      description: declaration.description,
      // The catalog stores plain JSON Schema on purpose so it stays provider
      // neutral; the SDK's stricter schema type is satisfied here, at the adapter.
      inputSchema: declaration.inputSchema as Parameters<typeof betaTool>[0]['inputSchema'],
      run: async (input: Record<string, unknown>) => {
        try {
          const result = await executeTool(declaration.name, input ?? {}, artifacts, context);
          return JSON.stringify({ result });
        } catch (error) {
          // Hand the failure back to the model instead of aborting the turn:
          // it can rephrase, try another tool, or ask the evaluator.
          const message = error instanceof Error ? error.message : 'Tool execution failed';
          return JSON.stringify({ error: message });
        }
      },
    }),
  );

  try {
    const finalMessage = await anthropic.beta.messages.toolRunner({
      model: env.ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      thinking: thinkingConfig(),
      system,
      tools,
      messages,
      max_iterations: MAX_TOOL_ROUNDS,
    });

    assertNotRefused(finalMessage.stop_reason);

    const message = finalMessage.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();

    if (!message) {
      throw new AppError('El agente devolvió una respuesta vacía', 502);
    }

    return { message, artifacts };
  } catch (error) {
    wrapLlmError(error);
  }
}

/** @deprecated Use runInterviewAgent — evaluation is no longer agent-driven. */
export const runLabLensAgent = runInterviewAgent;
