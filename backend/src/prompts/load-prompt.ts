import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppError } from '../utils/AppError.js';

const promptsDir = path.dirname(fileURLToPath(import.meta.url));

const cache = new Map<string, string>();

export async function loadPrompt(fileName: string): Promise<string> {
  const cached = cache.get(fileName);
  if (cached) {
    return cached;
  }

  try {
    const content = await readFile(path.join(promptsDir, fileName), 'utf-8');
    const trimmed = content.trim();
    cache.set(fileName, trimmed);
    return trimmed;
  } catch {
    throw new AppError(`Failed to load prompt: ${fileName}`, 500);
  }
}
