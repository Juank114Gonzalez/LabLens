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
  userId: string;
  initiativeId: string | null;
  title: string | null;
  status: ConversationStatus;
  completion: number;
  /** Empty checklist until attributes are derived from linked initiative. */
  initiativeData: InitiativeData;
  evaluation: EvaluationResult | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: ConversationMessage[];
};

export type ConversationListItem = {
  id: string;
  title: string;
  status: ConversationStatus;
  completion: number;
  preview: string;
  initiativeId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CollectingMessageResult = {
  type: 'collecting';
  conversationId: string;
  status: ConversationStatus;
  completion: number;
  reply: string;
  message: string;
  missingFields: string[];
  initiativeData: InitiativeData;
};

export type EvaluationMessageResult = {
  type: 'evaluation';
  conversationId: string;
  status: 'COMPLETED';
  completion: number;
  reply: string;
  message: string;
  evaluation: EvaluationResult;
};

export type MessageTurnResult = CollectingMessageResult | EvaluationMessageResult;
