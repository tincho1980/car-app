import { vehicleStatus, type VehicleStatus } from '@/core/vehicle-status';
import type { MaintenanceEvent, OdometerReading } from '@/core/types';
import type { PlanItem } from '@/server/db/schemas/plan';

// RN-09: recalcula el estado de cada ítem desde plan + lecturas + eventos y lo deja como caché
// en plan[].status. Conserva lo último notificado (lo usa el cron en F07).
export function planWithStatus(
  plan: PlanItem[],
  readings: OdometerReading[],
  events: MaintenanceEvent[],
  defaultKmPerDay: number,
  today: Date,
): { plan: PlanItem[]; status: VehicleStatus } {
  const status = vehicleStatus({ plan, readings, events, defaultKmPerDay }, today);
  const byId = new Map(status.items.map((s) => [s.itemId, s]));

  return {
    status,
    plan: plan.map((item) => {
      const s = byId.get(item.itemId);
      if (!s) return { ...item, status: undefined };
      return {
        ...item,
        status: {
          state: s.state,
          dueKm: s.dueKm,
          dueDate: s.dueDate,
          estDueDate: s.estDueDate,
          estimated: s.estimated,
          lastDone: s.lastDone,
          notifiedState: item.status?.notifiedState,
          notifiedAt: item.status?.notifiedAt,
        },
      };
    }),
  };
}
