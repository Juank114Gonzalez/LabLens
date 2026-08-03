import {
  createClassification,
  deleteClassification,
  getClassificationOrThrow,
  listClassifications,
  updateClassification,
} from '../repositories/classification.repository.js';
import type {
  CreateClassificationDto,
  UpdateClassificationDto,
} from '../validators/classification.validator.js';

export async function listIntelligentClassifications() {
  return listClassifications();
}

export async function getIntelligentClassification(id: string) {
  return getClassificationOrThrow(id);
}

export async function createIntelligentClassification(input: CreateClassificationDto) {
  return createClassification(input);
}

export async function updateIntelligentClassification(
  id: string,
  input: UpdateClassificationDto,
) {
  await getClassificationOrThrow(id);
  return updateClassification(id, input);
}

export async function deleteIntelligentClassification(id: string) {
  await getClassificationOrThrow(id);
  await deleteClassification(id);
}
