import { apiClient } from '@/api/client';
import type { UserRole } from '@/types/auth';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CriteriaItem = {
  id: string;
  nombre: string;
  descripcion: string;
  promptContext: string;
  peso: number;
  activo: boolean;
  orden: number;
};

export type CatalogItem = {
  id: string;
  nombre: string;
  descripcion: string;
  promptContext: string;
  activo: boolean;
};

export const listUsers = () => apiClient.get<AdminUser[]>('/api/users');
export const createUser = (body: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) => apiClient.post<AdminUser>('/api/users', body);
export const updateUser = (id: string, body: Partial<AdminUser> & { password?: string }) =>
  apiClient.patch<AdminUser>(`/api/users/${id}`, body);
export const updateUserRole = (id: string, role: UserRole) =>
  apiClient.patch<AdminUser>(`/api/users/${id}/role`, { role });
export const resetPassword = (id: string) =>
  apiClient.post<{ message: string }>(`/api/users/${id}/reset-password`);
export const deleteUser = (id: string) => apiClient.delete(`/api/users/${id}`);

export const listCriteria = () => apiClient.get<CriteriaItem[]>('/api/evaluation-criteria');
export const createCriteria = (body: Omit<CriteriaItem, 'id'>) =>
  apiClient.post<CriteriaItem>('/api/evaluation-criteria', body);
export const updateCriteria = (id: string, body: Partial<CriteriaItem>) =>
  apiClient.patch<CriteriaItem>(`/api/evaluation-criteria/${id}`, body);
export const deleteCriteria = (id: string) => apiClient.delete(`/api/evaluation-criteria/${id}`);
export const reorderCriteria = (
  items: Array<{ id: string; orden: number; peso: number; activo: boolean }>,
) => apiClient.put<CriteriaItem[]>('/api/evaluation-criteria/reorder', { items });

export const listClassifications = () =>
  apiClient.get<CatalogItem[]>('/api/intelligent-classifications');
export const createClassification = (body: Omit<CatalogItem, 'id'>) =>
  apiClient.post<CatalogItem>('/api/intelligent-classifications', body);
export const updateClassification = (id: string, body: Partial<CatalogItem>) =>
  apiClient.patch<CatalogItem>(`/api/intelligent-classifications/${id}`, body);
export const deleteClassification = (id: string) =>
  apiClient.delete(`/api/intelligent-classifications/${id}`);

export const listWorkTables = () => apiClient.get<CatalogItem[]>('/api/work-tables');
export const createWorkTable = (body: Omit<CatalogItem, 'id'>) =>
  apiClient.post<CatalogItem>('/api/work-tables', body);
export const updateWorkTable = (id: string, body: Partial<CatalogItem>) =>
  apiClient.patch<CatalogItem>(`/api/work-tables/${id}`, body);
export const deleteWorkTable = (id: string) => apiClient.delete(`/api/work-tables/${id}`);
