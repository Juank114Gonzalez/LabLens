import type { EvaluationResult } from './evaluation';
import type { InitiativeData } from './initiative';

export type ConversationStatus =
  | 'COLLECTING_INFORMATION'
  | 'READY_TO_EVALUATE'
  | 'COMPLETED';

export type MessageRole = 'user' | 'assistant' | 'system';

export type ConversationMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
};

export type ConversationView = {
  id: string;
  userId?: string;
  initiativeId: string | null;
  title: string | null;
  status: ConversationStatus;
  completion: number;
  /** Checklist projection; empty until fields are available. */
  initiativeData: InitiativeData;
  evaluation: EvaluationResult | null;
  createdAt: string;
  updatedAt: string;
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

export type ConversationListItem = {
  id: string;
  title: string;
  status: ConversationStatus;
  completion: number;
  favorite: boolean;
  preview: string;
  initiativeId?: string | null;
  evaluationId?: string | null;
  createdAt: string;
  updatedAt: string;
};
