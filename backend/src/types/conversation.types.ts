import type { ConversationStatus, MessageRole } from '@prisma/client';

export type ConversationMessage = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
};

export type ConversationView = {
  id: string;
  evaluationId: string;
  title: string | null;
  status: ConversationStatus;
  completion: number;
  createdAt: Date;
  updatedAt: Date;
  messages?: ConversationMessage[];
};

export type ConversationListItem = {
  id: string;
  evaluationId: string;
  title: string;
  status: ConversationStatus;
  completion: number;
  preview: string;
  createdAt: Date;
  updatedAt: Date;
};
