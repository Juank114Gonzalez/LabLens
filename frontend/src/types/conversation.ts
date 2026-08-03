import type { EvaluationReadiness, EvaluationResult, ReadinessStatus } from './evaluation';

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
  evaluationId: string | null;
  initiativeId: string | null;
  title: string | null;
  status: ConversationStatus;
  completion: number;
  readinessStatus: ReadinessStatus;
  readinessLabel: string;
  readiness: EvaluationReadiness | null;
  initiative: {
    id: string;
    nombre: string;
    status: string;
    companyContacts: unknown[];
    attachments: unknown[];
  } | null;
  evaluation: EvaluationResult | null;
  messageCount: number;
  elapsedMs: number;
  createdAt: string;
  updatedAt: string;
  messages?: ConversationMessage[];
};

export type CollectingMessageResult = {
  type: 'collecting' | 'ready';
  conversationId: string;
  status: ConversationStatus;
  readinessStatus: ReadinessStatus;
  readinessLabel: string;
  readiness: EvaluationReadiness | null;
  reply: string;
  canGenerate: boolean;
};

export type EvaluationMessageResult = {
  type: 'evaluation';
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
  readinessStatus?: ReadinessStatus;
  createdAt: string;
  updatedAt: string;
};

export type StartEvaluationResult = {
  evaluationId: string;
  conversationId: string;
  status: string;
  readinessStatus: ReadinessStatus;
  readiness: EvaluationReadiness | null;
  openingMessage: string;
};
