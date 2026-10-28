import { addDays, addMonths, daysBetween } from '@/core/dates';
import type { ItemStatus, LastDone, OdometerReading, PlanItemRule } from '@/core/types';

// Estado inicial con un solo dato (RF-08): completa la fecha o el km que falta con las
// lecturas (interpolando entre dos) o, antes de la primera, con el km/día hacia atrás.
export function estimateLastDone(
  readings: OdometerReading[],
  known: { date?: Date; km?: number },
  kmPerDay: number,
): LastDone | undefined {
  const { date, km } = known;
  if (date && km !== undefined) return { date, km, estimated: false };
  const sorted = [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = sorted[0];

  if (km !== undefined) {
    const after = sorted.find((r) => r.km >= km);
    const before = sorted.findLast((r) => r.km <= km);
    if (before && after && after.km > before.km) {
      const fraction = (km - before.km) / (after.km - before.km);
      const days = Math.round(fraction * daysBetween(before.date, after.date));
      return { date: addDays(before.date, days), km, estimated: true };
    }
    if (before) return { date: before.date, km, estimated: true };
    if (!first) return undefined;
    const daysBack = kmPerDay > 0 ? Math.round((first.km - km) / kmPerDay) : 0;
    return { date: addDays(first.date, -daysBack), km, estimated: true };
  }

  if (date) {
    const after = sorted.find((r) => r.date >= date);
    const before = sorted.findLast((r) => r.date <= date);
    if (before && after && after.date > before.date) {
      const fraction = daysBetween(before.date, date) / daysBetween(before.date, after.date);
      const kmAt = Math.round(before.km + fraction * (after.km - before.km));
      return { date, km: kmAt, estimated: true };
    }
    const base = before ?? after;
    if (!base) return undefined;
    const kmAt = Math.round(base.km + kmPerDay * daysBetween(base.date, date));
    return { date, km: Math.max(0, kmAt), estimated: true };
  }

  return undefined;
}

// Qué parte del intervalo ya se usó (0 a 1), por km o por tiempo: lo que esté más cerca.
export function consumedFraction(
  item: PlanItemRule,
  status: Pick<ItemStatus, 'lastDone' | 'kmLeft'>,
  today: Date,
): number {
  const { lastDone, kmLeft } = status;
  if (!lastDone) return 0;

  const byKm =
    item.intervalKm && kmLeft !== undefined ? (item.intervalKm - kmLeft) / item.intervalKm : 0;
  const byDate = item.intervalMonths
    ? daysBetween(lastDone.date, today) /
      daysBetween(lastDone.date, addMonths(lastDone.date, item.intervalMonths))
    : 0;

  return Math.min(1, Math.max(0, byKm, byDate));
}
