import type { ToolDefinition } from '../../types/tools.types.js';
import { generateExecutiveSummaryDeclaration } from './definition.js';
import { executeGenerateExecutiveSummary } from './execute.js';

export const generateExecutiveSummaryTool: ToolDefinition = {
  name: 'generateExecutiveSummary',
  declaration: generateExecutiveSummaryDeclaration,
  execute: executeGenerateExecutiveSummary,
};
