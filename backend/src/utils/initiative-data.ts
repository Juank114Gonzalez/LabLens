import type { Prisma } from '@prisma/client';
import {
  createEmptyInitiativeData,
  INITIATIVE_DATA_FIELDS,
  type InitiativeData,
  type InitiativeDataField,
  type InitiativeDataUpdates,
} from '../types/initiative-data.types.js';

function isFilled(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function parseInitiativeData(value: Prisma.JsonValue): InitiativeData {
  const base = createEmptyInitiativeData();

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return base;
  }

  const record = value as Record<string, unknown>;

  for (const field of INITIATIVE_DATA_FIELDS) {
    const raw = record[field];
    base[field] = typeof raw === 'string' && raw.trim() ? raw.trim() : null;
  }

  return base;
}

export function mergeInitiativeData(
  current: InitiativeData,
  updates: InitiativeDataUpdates,
): InitiativeData {
  const next: InitiativeData = { ...current };

  for (const field of Object.keys(updates) as InitiativeDataField[]) {
    const value = updates[field];

    if (value === undefined) {
      continue;
    }

    if (value === null) {
      continue;
    }

    const trimmed = value.trim();
    if (trimmed) {
      next[field] = trimmed;
    }
  }

  return next;
}

export function initiativeDataToText(data: InitiativeData): string {
  return INITIATIVE_DATA_FIELDS.map((field) => {
    const value = data[field];
    return isFilled(value) ? `${field}: ${value}` : null;
  })
    .filter((line): line is string => line !== null)
    .join('\n');
}

export function hasAnyInitiativeData(data: InitiativeData): boolean {
  return INITIATIVE_DATA_FIELDS.some((field) => isFilled(data[field]));
}
