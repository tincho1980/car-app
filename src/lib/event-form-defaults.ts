import type { EventFormDefaults, PickableItem } from '@/components/event-form';
import { partsToRows } from '@/lib/event-parts';
import { formatKm, formatMoney, toDateInput } from '@/lib/format';
import type { MaintenanceEventRecord } from '@/server/db/repos/events';
import type { Vehicle } from '@/server/db/repos/vehicles';

// Ítems que se pueden marcar como hechos: los activos del plan.
export function pickableItems(vehicle: Vehicle): PickableItem[] {
  return vehicle.plan
    .filter((i) => i.active)
    .map((i) => ({ itemId: i.itemId, name: i.name, category: i.category }));
}

export function newEventDefaults(
  today: Date,
  estimatedKm: number,
  itemIds: string[],
): EventFormDefaults {
  return {
    type: 'service',
    itemIds,
    date: toDateInput(today),
    km: formatKm(estimatedKm),
    parts: [],
  };
}

export function editEventDefaults(event: MaintenanceEventRecord): EventFormDefaults {
  return {
    type: event.type,
    itemIds: event.itemIds,
    date: toDateInput(event.date),
    km: formatKm(event.km),
    totalCost: event.totalCost !== undefined ? formatMoney(event.totalCost) : undefined,
    shop: event.shop,
    notes: event.notes,
    parts: partsToRows(event.parts),
  };
}
