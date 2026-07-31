import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { KNOWLEDGE_DIR } from '../config/paths.js';
import { AppError } from '../utils/AppError.js';

let cache: string | null = null;

/**
 * Loads every Markdown file from the knowledge directory and concatenates them.
 * File names are discovered at runtime — nothing is hardcoded.
 */
export async function loadKnowledgeBase(): Promise<string> {
  if (cache) {
    return cache;
  }

  try {
    const entries = await readdir(KNOWLEDGE_DIR, { withFileTypes: true });
    const markdownFiles = entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    if (markdownFiles.length === 0) {
      throw new AppError('Knowledge base is empty', 500);
    }

    const chunks = await Promise.all(
      markdownFiles.map(async (fileName) => {
        const content = await readFile(path.join(KNOWLEDGE_DIR, fileName), 'utf-8');
        return `# Source: ${fileName}\n\n${content.trim()}`;
      }),
    );

    cache = chunks.join('\n\n---\n\n');
    return cache;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to load knowledge base', 500);
  }
}

export function clearKnowledgeCache(): void {
  cache = null;
}
