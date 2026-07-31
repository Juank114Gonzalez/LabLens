import {
  COMPLETION_THRESHOLD,
  COMPLETION_WEIGHTS,
  FIELD_PRIORITY,
  type WeightedField,
} from '../config/completion.config.js';
import type { InitiativeData } from '../types/initiative-data.types.js';

function isFieldFilled(value: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Deterministic completion engine. No AI involved.
 */
export function calculateCompletion(data: InitiativeData): number {
  let total = 0;

  for (const [field, weight] of Object.entries(COMPLETION_WEIGHTS) as Array<
    [WeightedField, number]
  >) {
    if (isFieldFilled(data[field])) {
      total += weight;
    }
  }

  return Math.min(100, total);
}

export function getMissingWeightedFields(data: InitiativeData): WeightedField[] {
  return FIELD_PRIORITY.filter((field) => !isFieldFilled(data[field]));
}

export function isReadyForEvaluation(
  completion: number,
  readyToEvaluateFlag: boolean,
): boolean {
  return completion >= COMPLETION_THRESHOLD || readyToEvaluateFlag;
}

export { COMPLETION_THRESHOLD };
