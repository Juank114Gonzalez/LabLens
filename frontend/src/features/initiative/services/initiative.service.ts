import { apiClient } from '@/api/client';

/** Domain initiative as returned by the backend CRUD. */
export type DomainInitiative = {
  id: string;
  userId: string;
  status: string;
  nombre: string;
  diligenciadoPor: string;
  fechaDiligenciamiento: string;
  expectativaSolucion: string;
  areaProcesoImpactado: string;
  areaInvolucrada: string;
  urgencia: string;
  impacto: string;
  necesidad: string;
  porQueAhora: string;
  paraQue: string;
  comoSeResuelveHoy: string;
  createdAt: string;
  updatedAt: string;
};

export async function listInitiatives(): Promise<DomainInitiative[]> {
  return apiClient.get<DomainInitiative[]>('/api/initiatives');
}

export async function getInitiative(id: string): Promise<DomainInitiative> {
  return apiClient.get<DomainInitiative>(`/api/initiatives/${id}`);
}
