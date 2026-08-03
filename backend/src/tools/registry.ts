import type { FunctionDeclaration } from '@google/genai';
import type {
  ToolArtifacts,
  ToolContext,
  ToolDefinition,
  ToolName,
} from '../types/tools.types.js';
import { AppError } from '../utils/AppError.js';
import { findSimilarInitiativesTool, searchSimilarInitiativesTool } from './find-similar-initiatives/index.js';
import { generateBusinessCaseTool } from './generate-business-case/index.js';
import { getClassificationsTool, getWorkTablesTool } from './get-catalogs/index.js';
import { getEvaluationCriteriaTool } from './get-evaluation-criteria/index.js';
import { getInitiativeTool } from './get-initiative/index.js';
import { getPreviousEvaluationsTool } from './get-previous-evaluations/index.js';
import { saveEvaluationTool } from './save-evaluation/index.js';
import { searchKnowledgeTool } from './search-knowledge/index.js';
import { updateReadinessTool } from './update-readiness/index.js';

const tools: ToolDefinition[] = [
  searchKnowledgeTool,
  searchSimilarInitiativesTool,
  findSimilarInitiativesTool,
  getInitiativeTool,
  getEvaluationCriteriaTool,
  getPreviousEvaluationsTool,
  getClassificationsTool,
  getWorkTablesTool,
  updateReadinessTool,
  generateBusinessCaseTool,
  saveEvaluationTool,
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
  context: ToolContext,
): Promise<unknown> {
  const tool = toolsByName.get(name as ToolName);

  if (!tool) {
    throw new AppError(`Unknown tool: ${name}`, 500);
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
    return;
  }

  if (name === 'generateBusinessCase' && result && typeof result === 'object') {
    artifacts.businessCase = result as ToolArtifacts['businessCase'];
    return;
  }

  if (name === 'saveEvaluation' && result && typeof result === 'object') {
    artifacts.evaluationSaved = Boolean(
      (result as { saved?: boolean }).saved,
    );
  }
}
