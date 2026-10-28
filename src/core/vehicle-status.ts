import { itemStatus } from '@/core/item-status';
import { estimatedKm, kmPerDay, toVirtualKm, virtualOdometer } from '@/core/odometer';
import type {
  ItemStatus,
  LastDone,
  MaintenanceEvent,
  OdometerReading,
  PlanItemRule,
} from '@/core/types';

export type VehicleInput = {
  plan: PlanItemRule[];
  events: MaintenanceEvent[];
  readings: OdometerReading[];
  defaultKmPerDay: number;
};

export type VehicleStatus = {
  kmPerDay: number;
  // Km estimado hoy, en el tablero actual.
  estimatedKm?: number;
  items: (ItemStatus & { itemId: string })[];
};

// RN-09: todo se recalcula desde eventos, lecturas y plan; nada se guarda a mano.
// Los km se comparan en el odómetro virtual y los de vencimiento se devuelven en el tablero actual.
export function vehicleStatus(input: VehicleInput, today: Date): VehicleStatus {
  const odometer = virtualOdometer(input.readings, input.defaultKmPerDay);
  const perDay = kmPerDay(odometer.readings, today, input.defaultKmPerDay);
  const lastReading = odometer.readings.findLast((r) => r.date <= today);
  const estKm = lastReading ? estimatedKm(lastReading, perDay, today) : undefined;

  const pastEvents = input.events.filter((e) => e.date <= today);
  const items = input.plan
    .filter((item) => item.active)
    .map((item) => {
      // El más reciente entre el último evento y el estado inicial.
      const event = latestEventFor(pastEvents, item.itemId);
      const fromEvent: LastDone | undefined = event && {
        date: event.date,
        km: event.km,
        eventId: event.id,
      };
      const real = mostRecent(fromEvent, item.initialDone ?? undefined);
      const lastDone = real && { ...real, km: toVirtualKm(odometer, real.km, real.date) };
      const status = itemStatus(item, lastDone, estKm, perDay, today);
      return {
        ...status,
        itemId: item.itemId,
        dueKm: status.dueKm !== undefined ? status.dueKm - odometer.offset : undefined,
        lastDone: real,
      };
    });

  return {
    kmPerDay: perDay,
    estimatedKm: estKm !== undefined ? estKm - odometer.offset : undefined,
    items,
  };
}

// El más reciente por fecha; con la misma fecha, el de más km.
function latestEventFor(events: MaintenanceEvent[], itemId: string): MaintenanceEvent | undefined {
  return events
    .filter((e) => e.itemIds.includes(itemId))
    .reduce<MaintenanceEvent | undefined>((latest, e) => {
      if (!latest) return e;
      const byDate = e.date.getTime() - latest.date.getTime();
      return byDate > 0 || (byDate === 0 && e.km > latest.km) ? e : latest;
    }, undefined);
}

function mostRecent(a: LastDone | undefined, b: LastDone | undefined): LastDone | undefined {
  if (!a) return b;
  if (!b) return a;
  const byDate = b.date.getTime() - a.date.getTime();
  return byDate > 0 || (byDate === 0 && b.km > a.km) ? b : a;
}
