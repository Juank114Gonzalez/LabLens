import { Type } from '@google/genai';
import { ConversationStatus, ReadinessStatus } from '@prisma/client';
import { updateConversation } from '../../repositories/conversation.repository.js';
import { getEvaluationOrThrow, updateEvaluation } from '../../repositories/evaluation.repository.js';
import {
  readinessLabel,
  type EvaluationReadiness,
} from '../../types/evaluation-domain.types.js';
import type { ToolDefinition } from '../../types/tools.types.js';

export const updateReadinessTool: ToolDefinition = {
  name: 'updateReadiness',
  declaration: {
    name: 'updateReadiness',
    description:
      'Actualiza el estado EvaluationReadiness tras cada avance de la entrevista. No genera la evaluación final.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        problemUnderstanding: { type: Type.BOOLEAN },
        expectedValue: { type: Type.BOOLEAN },
        organizationalContext: { type: Type.BOOLEAN },
        scope: { type: Type.BOOLEAN },
        risks: { type: Type.BOOLEAN },
        dependencies: { type: Type.BOOLEAN },
        sufficientInformation: { type: Type.BOOLEAN },
        notes: { type: Type.STRING },
      },
      required: [
        'problemUnderstanding',
        'expectedValue',
        'organizationalContext',
        'scope',
        'risks',
        'dependencies',
        'sufficientInformation',
      ],
    },
  },
  execute: async (args, context) => {
    const readiness: EvaluationReadiness = {
      problemUnderstanding: Boolean(args.problemUnderstanding),
      expectedValue: Boolean(args.expectedValue),
      organizationalContext: Boolean(args.organizationalContext),
      scope: Boolean(args.scope),
      risks: Boolean(args.risks),
      dependencies: Boolean(args.dependencies),
      sufficientInformation: Boolean(args.sufficientInformation),
      notes: typeof args.notes === 'string' ? args.notes : undefined,
    };

    const label = readinessLabel(readiness);
    const evaluation = await getEvaluationOrThrow(context.evaluationId);

    await updateEvaluation(context.evaluationId, {
      readiness,
      readinessStatus: ReadinessStatus[label],
    });

    if (evaluation.conversation) {
      await updateConversation(evaluation.conversation.id, {
        status:
          label === 'READY'
            ? ConversationStatus.READY_TO_EVALUATE
            : ConversationStatus.COLLECTING_INFORMATION,
        completion: label === 'READY' ? 100 : label === 'IN_PROGRESS' ? 50 : 10,
      });
    }

    return {
      readinessStatus: label,
      readiness,
      canAskToGenerate: label === 'READY',
    };
  },
};
