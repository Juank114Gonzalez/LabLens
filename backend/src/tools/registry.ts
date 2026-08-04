import type {
  ToolArtifacts,
  ToolContext,
  ToolDeclaration,
  ToolDefinition,
  ToolName,
} from '../types/tools.types.js';
import { AppError } from '../utils/AppError.js';
import {
  findSimilarInitiativesTool,
  searchSimilarInitiativesTool,
} from './find-similar-initiatives/index.js';
import { getEvaluationCriteriaTool } from './get-evaluation-criteria/index.js';
import { getInitiativeTool } from './get-initiative/index.js';
import { getPreviousEvaluationsTool } from './get-previous-evaluations/index.js';
import { searchKnowledgeTool } from './search-knowledge/index.js';
import { updateReadinessTool } from './update-readiness/index.js';

export type AgentToolMode = 'interview';

/** Tools available in Modo Entrevista — never scoring or persistence. */
const interviewTools: ToolDefinition[] = [
  searchKnowledgeTool,
  searchSimilarInitiativesTool,
  findSimilarInitiativesTool,
  getInitiativeTool,
  getEvaluationCriteriaTool,
  getPreviousEvaluationsTool,
  updateReadinessTool,
];

const toolsByName = new Map<ToolName, ToolDefinition>(
  interviewTools.map((tool) => [tool.name, tool]),
);

export function getToolDeclarations(mode: AgentToolMode = 'interview'): ToolDeclaration[] {
  if (mode === 'interview') {
    return interviewTools.map((tool) => tool.declaration);
  }
  return [];
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  artifacts: ToolArtifacts,
  context: ToolContext,
): Promise<unknown> {
  const tool = toolsByName.get(name as ToolName);

  if (!tool) {
    throw new AppError(
      `Tool no disponible en modo entrevista: ${name}. La evaluación corre en el pipeline de backend.`,
      400,
    );
  }

  const result = await tool.execute(args ?? {}, context);
  captureArtifacts(name as ToolName, result, artifacts);
  return result;
}

function captureArtifacts(
  name: ToolName,
  result: unknown,
  artifacts: ToolArtifacts,
): void {
  if (
    (name === 'searchSimilarInitiatives' || name === 'findSimilarInitiatives') &&
    result &&
    typeof result === 'object'
  ) {
    const payload = result as { results?: ToolArtifacts['similarInitiatives'] };
    artifacts.similarInitiatives = payload.results ?? [];
    return;
  }

  if (name === 'updateReadiness' && result && typeof result === 'object') {
    const payload = result as { readiness?: ToolArtifacts['readiness'] };
    artifacts.readiness = payload.readiness ?? null;
  }
}
