import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { MOCK_DIR } from '../config/paths.js';
import type { Initiative } from '../types/initiative.types.js';
import { AppError } from '../utils/AppError.js';

const initiativeSchema = z.object({
  title: z.string().min(1),
  status: z.enum(['Aprobada', 'En evaluación', 'Rechazada', 'Piloto']),
  fit: z.number().min(0).max(100),
  reason: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

const initiativesSchema = z.array(initiativeSchema);

const INITIATIVES_FILE = path.join(MOCK_DIR, 'iniciativas.json');

let cache: Initiative[] | null = null;

/**
 * Data-access layer for historical initiatives.
 * Today reads a JSON mock; later can swap to PostgreSQL without touching controllers.
 */
export async function getAllInitiatives(): Promise<Initiative[]> {
  if (cache) {
    return cache;
  }

  try {
    const raw = await readFile(INITIATIVES_FILE, 'utf-8');
    const parsed = initiativesSchema.parse(JSON.parse(raw));
    cache = parsed;
    return parsed;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to load initiatives mock data', 500);
  }
}

export function clearInitiativesCache(): void {
  cache = null;
}
