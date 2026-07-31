import { calculateFitScore } from '../../services/fit.service.js';
import { calculateFitArgsSchema } from './schema.js';

export async function executeCalculateFit(rawArgs: Record<string, unknown>) {
  const args = calculateFitArgsSchema.parse(rawArgs);
  return calculateFitScore(args.initiativeDescription);
}
