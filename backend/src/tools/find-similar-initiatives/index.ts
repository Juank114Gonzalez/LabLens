import type { ToolDefinition } from '../../types/tools.types.js';
import { findSimilarInitiativesDeclaration } from './definition.js';
import { executeFindSimilarInitiatives } from './execute.js';

export const findSimilarInitiativesTool: ToolDefinition = {
  name: 'findSimilarInitiatives',
  declaration: findSimilarInitiativesDeclaration,
  execute: executeFindSimilarInitiatives,
};
