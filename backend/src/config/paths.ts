import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

/** Root of the compiled/runtime `src` tree. */
export const SRC_ROOT = path.resolve(currentDir, '..');

export const KNOWLEDGE_DIR = path.join(SRC_ROOT, 'knowledge');
export const MOCK_DIR = path.join(SRC_ROOT, 'mock');
