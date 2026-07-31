import type { FunctionDeclaration } from '@google/genai';
import type { ToolArtifacts, ToolDefinition, ToolName } from '../types/tools.types.js';
import { AppError } from '../utils/AppError.js';
import { calculateFitTool } from './calculate-fit/index.js';
import { findSimilarInitiativesTool } from './find-similar-initiatives/index.js';
import { generateExecutiveSummaryTool } from './generate-executive-summary/index.js';
import { searchKnowledgeTool } from './search-knowledge/index.js';

const tools: ToolDefinition[] = [
  searchKnowledgeTool,
  findSimilarInitiativesTool,
  calculateFitTool,
  generateExecutiveSummaryTool,
];

const toolsByName = new Map<ToolName, ToolDefinition>(
  tools.map((tool) => [tool.name, tool]),
);

export function getToolDeclarations(): FunctionDeclaration[] {
  return tools.map((tool) => tool.declaration);
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  artifacts: ToolArtifacts,
): Promise<unknown> {
  const tool = toolsByName.get(name as ToolName);

  if (!tool) {
    throw new AppError(`Unknown tool: ${name}`, 500);
  }

  const result = await tool.execute(args ?? {});
  captureArtifacts(name as ToolName, result, artifacts);
  return result;
}

function captureArtifacts(
  name: ToolName,
  result: unknown,
  artifacts: ToolArtifacts,
): void {
  if (name === 'calculateFit' && result && typeof result === 'object') {
    artifacts.fit = result as ToolArtifacts['fit'];
    return;
  }

  if (name === 'findSimilarInitiatives' && result && typeof result === 'object') {
    const payload = result as { results?: ToolArtifacts['similarInitiatives'] };
    artifacts.similarInitiatives = payload.results ?? [];
    return;
  }

  if (name === 'generateExecutiveSummary' && result && typeof result === 'object') {
    artifacts.summary = result as ToolArtifacts['summary'];
  }
}
