import type { OdometerReading } from '@/core/types';

export type ReadingValidation =
  { ok: true } | { ok: false; reason: 'below-previous' | 'above-next'; reading: OdometerReading };

// RN-07: el km de una lectura no puede ser menor al de una lectura anterior en fecha
// (ni mayor al de una posterior). Excepción: "cambié el tablero u odómetro".
// Las lecturas del mismo día cuentan como anteriores.
export function validateReading(
  readings: OdometerReading[],
  candidate: OdometerReading,
): ReadingValidation {
  const sorted = [...readings].sort((a, b) => a.date.getTime() - b.date.getTime() || a.km - b.km);

  const previous = sorted.findLast((r) => r.date <= candidate.date);
  if (previous && !candidate.odometerReset && candidate.km < previous.km) {
    return { ok: false, reason: 'below-previous', reading: previous };
  }

  // Una lectura posterior que es cambio de tablero arranca otra cuenta: no limita.
  const next = sorted.find((r) => r.date > candidate.date);
  if (next && !next.odometerReset && candidate.km > next.km) {
    return { ok: false, reason: 'above-next', reading: next };
  }

  return { ok: true };
}
