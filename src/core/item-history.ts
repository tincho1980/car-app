import type { LastDone, MaintenanceEvent } from '@/core/types';

export type ItemHistoryEntry = {
  // Sin eventId = el estado inicial cargado al armar el plan.
  eventId?: string;
  date: Date;
  km: number;
  kmSincePrevious?: number;
};

// RF-28: cada vez que se hizo un ítem, cuántos km pasaron entre cambios y el promedio.
// Sirve para ajustar el intervalo al uso real. Más reciente primero.
export function itemHistory(
  events: MaintenanceEvent[],
  itemId: string,
  initialDone?: LastDone | null,
): { entries: ItemHistoryEntry[]; averageKm?: number } {
  const done: ItemHistoryEntry[] = events
    .filter((e) => e.itemIds.includes(itemId))
    .map((e) => ({ eventId: e.id, date: e.date, km: e.km }));
  if (initialDone) done.push({ date: initialDone.date, km: initialDone.km });

  const ascending = done.sort((a, b) => a.date.getTime() - b.date.getTime() || a.km - b.km);
  const entries = ascending.map((entry, i) => ({
    ...entry,
    kmSincePrevious: i > 0 ? entry.km - ascending[i - 1].km : undefined,
  }));

  const gaps = entries.flatMap((e) => (e.kmSincePrevious !== undefined ? [e.kmSincePrevious] : []));
  const averageKm =
    gaps.length > 0 ? Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length) : undefined;

  return { entries: entries.reverse(), averageKm };
}
