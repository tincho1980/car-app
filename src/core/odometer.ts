import { addDays, daysBetween } from '@/core/dates';
import type { OdometerReading } from '@/core/types';

const AVERAGE_WINDOW_DAYS = 90;

// RN-03: (última lectura − lectura de hace ~90 días) / días entre ambas.
// Toma la lectura más reciente con al menos 90 días de antigüedad; si no hay, la más vieja.
export function kmPerDay(
  readings: OdometerReading[],
  today: Date,
  defaultKmPerDay: number,
): number {
  const past = sortByDate(readings.filter((r) => r.date <= today));
  if (past.length < 2) return defaultKmPerDay;

  const last = past[past.length - 1];
  const windowStart = addDays(last.date, -AVERAGE_WINDOW_DAYS);
  const base = past.findLast((r) => r.date <= windowStart) ?? past[0];
  const days = daysBetween(base.date, last.date);
  if (days <= 0) return defaultKmPerDay;

  return Math.max(0, (last.km - base.km) / days);
}

// RN-04: última lectura + km/día × días transcurridos.
export function estimatedKm(lastReading: OdometerReading, perDay: number, today: Date): number {
  const days = Math.max(0, daysBetween(lastReading.date, today));
  return Math.round(lastReading.km + perDay * days);
}

export type VirtualOdometer = {
  // Lecturas en km totales recorridos, ordenadas por fecha.
  readings: OdometerReading[];
  // Desfases acumulados desde cada cambio de tablero.
  resets: { date: Date; offset: number }[];
  // Desfase del tablero actual: km virtuales − km del tablero.
  offset: number;
};

// Cambio de odómetro (RN-07): el tablero nuevo arranca en otro número. Para seguir comparando
// km, cada cambio suma un desfase = km estimados del tablero viejo a esa fecha − km del nuevo.
export function virtualOdometer(
  readings: OdometerReading[],
  defaultKmPerDay: number,
): VirtualOdometer {
  const virtual: OdometerReading[] = [];
  const resets: VirtualOdometer['resets'] = [];
  let offset = 0;

  for (const reading of sortByDate(readings)) {
    const previous = virtual[virtual.length - 1];
    if (reading.odometerReset && previous) {
      const perDay = kmPerDay(virtual, reading.date, defaultKmPerDay);
      offset = estimatedKm(previous, perDay, reading.date) - reading.km;
      resets.push({ date: reading.date, offset });
    }
    virtual.push({ date: reading.date, km: reading.km + offset });
  }

  return { readings: virtual, resets, offset };
}

// Traduce un km a km virtuales según el tablero vigente en esa fecha.
// Un evento del mismo día del cambio se toma como del tablero nuevo.
export function toVirtualKm(odometer: VirtualOdometer, km: number, date: Date): number {
  const reset = odometer.resets.findLast((r) => r.date <= date);
  return km + (reset?.offset ?? 0);
}

function sortByDate(readings: OdometerReading[]): OdometerReading[] {
  return [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());
}

export type OdometerSummary = {
  lastKm: number;
  lastDate: Date;
  kmPerDay: number;
  readingsCount: number;
};

// Caché del odómetro que se guarda en el auto: última lectura real (en el tablero actual),
// km/día (RN-03, continuo aunque haya cambios de tablero) y cantidad de lecturas.
export function odometerSummary(
  readings: OdometerReading[],
  defaultKmPerDay: number,
  today: Date,
): OdometerSummary {
  const sorted = sortByDate(readings);
  const last = sorted.findLast((r) => r.date <= today) ?? sorted[sorted.length - 1];
  if (!last) throw new Error('Un auto tiene al menos una lectura de odómetro');

  const odometer = virtualOdometer(sorted, defaultKmPerDay);
  return {
    lastKm: last.km,
    lastDate: last.date,
    kmPerDay: kmPerDay(odometer.readings, today, defaultKmPerDay),
    readingsCount: sorted.length,
  };
}
