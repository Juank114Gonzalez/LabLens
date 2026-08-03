import type { ToolDefinition } from '../../types/tools.types.js';
import { findSimilarInitiativesDeclaration } from './definition.js';
import { executeFindSimilarInitiatives } from './execute.js';

export const findSimilarInitiativesTool: ToolDefinition = {
  name: 'findSimilarInitiatives',
  declaration: findSimilarInitiativesDeclaration,
  execute: async (args) => executeFindSimilarInitiatives(args),
};

/** Alias requested by product naming. */
export const searchSimilarInitiativesTool: ToolDefinition = {
  name: 'searchSimilarInitiatives',
  declaration: {
    ...findSimilarInitiativesDeclaration,
    name: 'searchSimilarInitiatives',
    description:
      'Busca iniciativas históricas similares (catálogo del Lab). Úsala para contrastar, no para inventar.',
  },
  execute: async (args) => executeFindSimilarInitiatives(args),
};
