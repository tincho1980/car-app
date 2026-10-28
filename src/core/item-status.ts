import { addDays, addMonths, daysBetween, minDate } from '@/core/dates';
import type { ItemState, ItemStatus, LastDone, PlanItemRule, Snooze } from '@/core/types';

// Estado de un ítem del plan (RN-01, 02, 05, 06, 10 y posponer).
// estKm y kmPerDay vienen del auto; estKm falta si no hay lecturas de odómetro.
export function itemStatus(
  item: PlanItemRule,
  lastDone: LastDone | undefined,
  estKm: number | undefined,
  kmPerDay: number,
  today: Date,
): ItemStatus {
  const snoozed = isSnoozed(item.snooze, estKm, today);

  // Sin último realizado no hay desde dónde contar: "Sin dato", sin alertas.
  if (!lastDone) return { state: 'unknown', estimated: false, snoozed };

  // RN-01 y RN-02: último realizado + intervalo, en km y/o en fecha.
  const dueKm = item.intervalKm !== undefined ? lastDone.km + item.intervalKm : undefined;
  const dueDate =
    item.intervalMonths !== undefined ? addMonths(lastDone.date, item.intervalMonths) : undefined;
  const kmLeft = dueKm !== undefined && estKm !== undefined ? dueKm - estKm : undefined;

  // RN-05: fecha estimada por km = hoy + km que faltan / km diario. Gana la más cercana.
  const kmDueDate =
    kmLeft !== undefined && kmPerDay > 0
      ? addDays(today, Math.round(kmLeft / kmPerDay))
      : undefined;
  const estDueDate = minDate(kmDueDate, dueDate);
  const estimated = kmDueDate !== undefined && estDueDate === kmDueDate;

  const daysToDueDate = dueDate ? daysBetween(today, dueDate) : undefined;
  const state = stateFor(item, kmLeft, daysToDueDate);

  return {
    state,
    dueKm,
    dueDate,
    estDueDate,
    kmLeft,
    daysLeft: estDueDate ? daysBetween(today, estDueDate) : undefined,
    estimated,
    snoozed,
    lastDone,
  };
}

// RN-06: el umbral en km se compara con el km y el de días con la fecha de vencimiento.
function stateFor(
  item: PlanItemRule,
  kmLeft: number | undefined,
  daysToDueDate: number | undefined,
): ItemState {
  if (kmLeft === undefined && daysToDueDate === undefined) return 'unknown';
  if ((kmLeft !== undefined && kmLeft <= 0) || (daysToDueDate !== undefined && daysToDueDate <= 0))
    return 'overdue';
  if (
    (kmLeft !== undefined && kmLeft <= item.warnKm) ||
    (daysToDueDate !== undefined && daysToDueDate <= item.warnDays)
  )
    return 'soon';
  return 'ok';
}

// Pospuesto hasta una fecha (exclusiva) o hasta llegar a un km.
function isSnoozed(snooze: Snooze | undefined, estKm: number | undefined, today: Date): boolean {
  if (!snooze) return false;
  const byDate = snooze.untilDate !== undefined && today < snooze.untilDate;
  const byKm = snooze.untilKm !== undefined && estKm !== undefined && estKm < snooze.untilKm;
  return byDate || byKm;
}
