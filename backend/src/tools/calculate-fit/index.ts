import type { ToolDefinition } from '../../types/tools.types.js';
import { calculateFitDeclaration } from './definition.js';
import { executeCalculateFit } from './execute.js';

/** Legacy tool kept for compatibility; evaluation flow uses saveEvaluation weights. */
export const calculateFitTool: ToolDefinition = {
  name: 'calculateFit',
  declaration: calculateFitDeclaration,
  execute: async (args) => executeCalculateFit(args),
};
