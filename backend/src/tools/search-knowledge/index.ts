import type { ToolDefinition } from '../../types/tools.types.js';
import { searchKnowledgeDeclaration } from './definition.js';
import { executeSearchKnowledge } from './execute.js';

export const searchKnowledgeTool: ToolDefinition = {
  name: 'searchKnowledge',
  declaration: searchKnowledgeDeclaration,
  execute: async (args) => executeSearchKnowledge(args),
};
