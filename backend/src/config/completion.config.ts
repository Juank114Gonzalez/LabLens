import type { InitiativeDataField } from '../types/initiative-data.types.js';

/**
 * Weighted completion rules. Do not hardcode these values in services.
 * Sum of all weights must equal 100.
 */
export const COMPLETION_WEIGHTS = {
  problem: 10,
  objective: 10,
  sponsor: 10,
  affectedUsers: 10,
  expectedBenefit: 15,
  availableData: 15,
  businessArea: 10,
  stakeholders: 5,
  dependencies: 5,
  risks: 5,
  technologies: 5,
  estimatedTimeline: 5,
} as const satisfies Partial<Record<InitiativeDataField, number>>;

export type WeightedField = keyof typeof COMPLETION_WEIGHTS;

/** Minimum completion required before evaluation can run. */
export const COMPLETION_THRESHOLD = 85;

export const FIELD_PRIORITY: WeightedField[] = [
  'problem',
  'objective',
  'businessArea',
  'sponsor',
  'affectedUsers',
  'expectedBenefit',
  'availableData',
  'stakeholders',
  'dependencies',
  'risks',
  'technologies',
  'estimatedTimeline',
];
