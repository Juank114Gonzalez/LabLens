import { apiClient } from '@/api/client';
import type { InitiativeStatus, SourceType } from '@/features/initiative/types';

export type InitiativeStats = {
  total: number;
  currentWindow: number;
  previousWindow: number;
  windowDays: number;
  labInboxPending: number;
  byStatus: Array<{ status: InitiativeStatus; count: number }>;
  bySource: Array<{ sourceType: SourceType; count: number }>;
  byClassification: Array<{ id: string; nombre: string; count: number }>;
  /** Área del solicitante, ya ordenada de mayor a menor. Excluye las vacías. */
  byArea: Array<{ area: string; count: number }>;
  timeline: Array<{ date: string; lab: number; external: number; pending: number }>;
};

export async function getInitiativeStats(): Promise<InitiativeStats> {
  return apiClient.get<InitiativeStats>('/api/initiatives/stats');
}
