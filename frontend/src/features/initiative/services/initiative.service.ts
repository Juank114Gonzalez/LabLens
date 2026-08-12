import { apiClient } from '@/api/client';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/auth.store';
import type {
  DomainInitiative,
  EvaluationSummary,
  InitiativeDraftPayload,
  InitiativeStatus,
  SourceType,
} from '@/features/initiative/types';

export type InitiativeFilters = {
  status?: InitiativeStatus[];
  sourceType?: SourceType[];
  triageClassificationId?: string;
  triageWorkTableId?: string;
  from?: string;
  to?: string;
  search?: string;
};

function toQueryString(filters: InitiativeFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.status?.length) params.set('status', filters.status.join(','));
  if (filters.sourceType?.length) params.set('sourceType', filters.sourceType.join(','));
  if (filters.triageClassificationId) {
    params.set('triageClassificationId', filters.triageClassificationId);
  }
  if (filters.triageWorkTableId) {
    params.set('triageWorkTableId', filters.triageWorkTableId);
  }
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.search) params.set('search', filters.search);
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function listInitiatives(
  filters?: InitiativeFilters,
): Promise<DomainInitiative[]> {
  return apiClient.get<DomainInitiative[]>(`/api/initiatives${toQueryString(filters)}`);
}

export async function getInitiative(id: string): Promise<DomainInitiative> {
  return apiClient.get<DomainInitiative>(`/api/initiatives/${id}`);
}

export async function createDraft(
  payload: InitiativeDraftPayload = {},
): Promise<DomainInitiative> {
  return apiClient.post<DomainInitiative>('/api/initiatives', payload);
}

export async function saveDraft(
  id: string,
  payload: InitiativeDraftPayload,
): Promise<DomainInitiative> {
  return apiClient.patch<DomainInitiative>(`/api/initiatives/${id}`, payload);
}

export async function registerInitiative(
  id: string,
  payload?: InitiativeDraftPayload,
): Promise<DomainInitiative> {
  return apiClient.post<DomainInitiative>(`/api/initiatives/${id}/register`, payload);
}

export async function deleteInitiative(id: string): Promise<void> {
  await apiClient.delete(`/api/initiatives/${id}`);
}

/** Duplica la iniciativa como borrador editable. No arrastra el triage. */
export async function copyInitiative(id: string): Promise<DomainInitiative> {
  return apiClient.post<DomainInitiative>(`/api/initiatives/${id}/copy`, {});
}

export type TriageResult = {
  initiativeId: string;
  status: InitiativeStatus;
  isLabScope: boolean;
  confidence: number;
  needsReview: boolean;
  reviewReason: string | null;
  classification: { id: string; nombre: string; descripcion: string } | null;
  classificationReasoning: string | null;
  workTable: { id: string; nombre: string; descripcion: string } | null;
  workTableReasoning: string | null;
  notificationSent: boolean;
};

/** Vuelve a correr el triage sobre una sola iniciativa ya registrada. */
export async function retriageInitiative(id: string): Promise<TriageResult> {
  return apiClient.post<TriageResult>(`/api/initiatives/${id}/triage`, {});
}

export type TriageSweepResult = {
  alcance: 'pendientes' | 'todas';
  total: number;
  triadas: number;
  fallidas: number;
};

export async function runTriageSweep(
  alcance: 'pendientes' | 'todas',
): Promise<TriageSweepResult> {
  return apiClient.post<TriageSweepResult>('/api/initiatives/triage-sweep', { alcance });
}

export async function listInitiativeEvaluations(
  id: string,
): Promise<EvaluationSummary[]> {
  return apiClient.get<EvaluationSummary[]>(`/api/initiatives/${id}/evaluations`);
}

export async function uploadAttachment(
  initiativeId: string,
  file: File,
): Promise<DomainInitiative['attachments'][number]> {
  const token = useAuthStore.getState().accessToken;
  const form = new FormData();
  form.append('file', file);
  form.append('initiativeId', initiativeId);

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/attachments`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: form,
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message ?? 'No se pudo subir el archivo');
  }
  return payload.data;
}

export async function deleteAttachment(id: string): Promise<void> {
  await apiClient.delete(`/api/attachments/${id}`);
}

export async function downloadEvidencesZip(initiativeId: string): Promise<void> {
  const token = useAuthStore.getState().accessToken;
  const response = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/api/attachments/download?initiativeId=${initiativeId}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    },
  );

  if (!response.ok) {
    throw new Error('No se pudieron descargar las evidencias');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `evidencias-${initiativeId}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
}
