import { daysBetween } from '@/core/dates';
import type { ItemState } from '@/core/types';

const OVERDUE_REMINDER_DAYS = 7;

// Cuánto preocupa cada estado: solo se avisa cuando empeora.
const SEVERITY: Record<ItemState, number> = { unknown: 0, ok: 0, soon: 1, overdue: 2 };

// RN-08: push solo en cambio de estado hacia peor; si sigue vencido, un recordatorio semanal.
// prev es el último estado notificado (undefined si nunca se evaluó).
export function shouldNotify(
  prev: ItemState | undefined,
  next: ItemState,
  lastNotifiedAt: Date | undefined,
  snoozed: boolean,
  today: Date,
): boolean {
  if (snoozed) return false;
  if (next === 'overdue' && prev === 'overdue') {
    return !lastNotifiedAt || daysBetween(lastNotifiedAt, today) >= OVERDUE_REMINDER_DAYS;
  }
  return SEVERITY[next] > SEVERITY[prev ?? 'ok'];
}
