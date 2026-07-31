import type { ConversationStatus, MessageRole } from '@prisma/client';
import type { EvaluationResult } from './evaluation.types.js';
import type { InitiativeData } from './initiative-data.types.js';

export type ConversationMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
};

export type ConversationView = {
  id: string;
  status: ConversationStatus;
  completion: number;
  initiativeData: InitiativeData;
  evaluation: EvaluationResult | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: ConversationMessage[];
};

export type CollectingMessageResult = {
  type: 'collecting';
  conversationId: string;
  status: ConversationStatus;
  completion: number;
  reply: string;
  missingFields: string[];
  initiativeData: InitiativeData;
};

export type EvaluationMessageResult = {
  type: 'evaluation';
  conversationId: string;
  status: 'COMPLETED';
  completion: number;
  reply: string;
  evaluation: EvaluationResult;
};

export type MessageTurnResult = CollectingMessageResult | EvaluationMessageResult;
