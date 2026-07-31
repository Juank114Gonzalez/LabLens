const GREETING_PATTERNS = [
  /^hola\b/i,
  /^buenos\s+d[ií]as\b/i,
  /^buenas\s+tardes\b/i,
  /^buenas\s+noches\b/i,
  /^buenas\b/i,
  /^hey\b/i,
  /^hi\b/i,
  /^hello\b/i,
  /^qu[eé]\s+haces\b/i,
  /^qu[eé]\s+eres\b/i,
  /^qui[eé]n\s+eres\b/i,
  /^c[oó]mo\s+est[aá]s\b/i,
  /^saludos\b/i,
];

export const GREETING_REPLY =
  'Hola, soy LabLens, el asistente del Innovation Lab de ACH. Mi función es ayudarte a estructurar y evaluar iniciativas de innovación para determinar si son candidatas para desarrollarse dentro del Lab.\n\nCuando quieras, descríbeme tu iniciativa y comenzaremos a analizarla.';

export function isGreetingMessage(message: string): boolean {
  const normalized = message.trim().replace(/\s+/g, ' ');

  if (!normalized || normalized.length > 80) {
    return false;
  }

  return GREETING_PATTERNS.some((pattern) => pattern.test(normalized));
}
