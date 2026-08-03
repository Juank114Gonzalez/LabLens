import {
  createWorkTable,
  deleteWorkTable,
  getWorkTableOrThrow,
  listWorkTables,
  updateWorkTable,
} from '../repositories/work-table.repository.js';
import type {
  CreateWorkTableDto,
  UpdateWorkTableDto,
} from '../validators/work-table.validator.js';

export async function listWorkTablesService() {
  return listWorkTables();
}

export async function getWorkTableService(id: string) {
  return getWorkTableOrThrow(id);
}

export async function createWorkTableService(input: CreateWorkTableDto) {
  return createWorkTable(input);
}

export async function updateWorkTableService(id: string, input: UpdateWorkTableDto) {
  await getWorkTableOrThrow(id);
  return updateWorkTable(id, input);
}

export async function deleteWorkTableService(id: string) {
  await getWorkTableOrThrow(id);
  await deleteWorkTable(id);
}
