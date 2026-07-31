import type { ToolDefinition } from '../../types/tools.types.js';
import { calculateFitDeclaration } from './definition.js';
import { executeCalculateFit } from './execute.js';

export const calculateFitTool: ToolDefinition = {
  name: 'calculateFit',
  declaration: calculateFitDeclaration,
  execute: executeCalculateFit,
};
