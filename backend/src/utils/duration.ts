/** Parses values like `15m`, `7d`, `3600` (seconds) into milliseconds. */
export function durationToMs(value: string): number {
  const trimmed = value.trim();
  const match = /^(\d+)([smhd])?$/i.exec(trimmed);

  if (!match) {
    throw new Error(`Invalid duration: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = (match[2] ?? 's').toLowerCase();

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return amount * multipliers[unit]!;
}
