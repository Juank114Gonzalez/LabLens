import type { FitResult } from '../types/fit.types.js';
import { tokenize } from '../utils/keywords.js';

const IMPACT_KEYWORDS = [
  'impacto',
  'ahorro',
  'costos',
  'ingresos',
  'eficiencia',
  'tiempo',
  'reducir',
  'optimizar',
  'escalar',
];

const DATA_KEYWORDS = [
  'datos',
  'data',
  'historial',
  'api',
  'integracion',
  'core',
  'transacciones',
  'logs',
  'dataset',
];

const ALIGNMENT_KEYWORDS = [
  'automatizacion',
  'automatizar',
  'ia',
  'llm',
  'agente',
  'ocr',
  'nlp',
  'conciliacion',
  'pagos',
  'fraude',
  'compliance',
  'onboarding',
  'chatbot',
  'workflow',
];

const COMPLEXITY_KEYWORDS = [
  'complejo',
  'complejidad',
  'regulatorio',
  'legacy',
  'migracion',
  'realtime',
  'latencia',
  'integraciones',
];

const SPONSOR_KEYWORDS = ['sponsor', 'patrocinio', 'owner', 'presupuesto', 'direccion'];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countHits(text: string, keywords: string[]): number {
  const normalized = normalize(text);
  const tokens = new Set(tokenize(text));

  return keywords.reduce((count, keyword) => {
    const key = normalize(keyword);
    if (tokens.has(key) || (key.length > 3 && normalized.includes(key))) {
      return count + 1;
    }
    if (key.length <= 3 && new RegExp(`(^|[^a-z0-9])${key}([^a-z0-9]|$)`).test(normalized)) {
      return count + 1;
    }
    return count;
  }, 0);
}

function scoreFromHits(hits: number, base: number, step: number, maxBonus: number): number {
  return clamp(base + Math.min(hits * step, maxBonus));
}

/**
 * Deterministic Fit engine. Replaceable later without touching tools/Gemini.
 */
export function calculateFitScore(description: string): FitResult {
  const impact = scoreFromHits(countHits(description, IMPACT_KEYWORDS), 55, 8, 40);
  const dataAvailability = scoreFromHits(countHits(description, DATA_KEYWORDS), 50, 10, 45);
  const alignment = scoreFromHits(countHits(description, ALIGNMENT_KEYWORDS), 50, 9, 45);
  const complexityHits = countHits(description, COMPLEXITY_KEYWORDS);
  const complexity = clamp(80 - complexityHits * 10);
  const sponsorHits = countHits(description, SPONSOR_KEYWORDS);

  const fit = clamp(
    impact * 0.3 +
      dataAvailability * 0.2 +
      alignment * 0.25 +
      complexity * 0.15 +
      clamp(45 + sponsorHits * 15) * 0.1,
  );

  const observations: string[] = [];
  if (impact >= 75) observations.push('Se detectan señales claras de impacto de negocio.');
  if (dataAvailability < 60) {
    observations.push('La disponibilidad de datos parece limitada o poco explícita.');
  }
  if (sponsorHits === 0) {
    observations.push('No se identifica un sponsor/owner con claridad.');
  }
  if (alignment >= 75) {
    observations.push('Hay alineación con capacidades priorizadas del Lab (IA/automatización).');
  }
  if (complexity <= 60) {
    observations.push('La complejidad percibida es elevada para un MVP temprano.');
  }
  if (observations.length === 0) {
    observations.push('Información parcial: el Fit es orientativo y conviene validarlo en comité.');
  }

  return {
    fit,
    impact,
    alignment,
    dataAvailability,
    complexity,
    observations,
  };
}
