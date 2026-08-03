import { apiClient } from '@/api/client';
import { env } from '@/config/env';
import { useAuthStore } from '@/stores/auth.store';
import type {
  DomainInitiative,
  EvaluationSummary,
  InitiativeDraftPayload,
} from '@/features/initiative/types';

export async function listInitiatives(): Promise<DomainInitiative[]> {
  return apiClient.get<DomainInitiative[]>('/api/initiatives');
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
