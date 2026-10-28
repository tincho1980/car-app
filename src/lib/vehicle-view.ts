import { estimatedKm } from '@/core/odometer';
import { formatDate } from '@/lib/format';
import type { Vehicle } from '@/server/db/repos/vehicles';

// Lo que muestran las pantallas de un auto, con el km estimado del día (RN-04).
export function vehicleView(vehicle: Vehicle, today: Date) {
  const { lastKm, lastDate, kmPerDay } = vehicle.odometer;
  const lastDateText = formatDate(lastDate);
  return {
    id: vehicle.id,
    title: vehicle.alias ?? `${vehicle.make} ${vehicle.model}`,
    // "FIAT PALIO 1.4 FIRE · 2011"
    subtitle: `${vehicle.make} ${vehicle.model} ${vehicle.version} · ${vehicle.year}`,
    estimatedKm: estimatedKm({ date: lastDate, km: lastKm }, kmPerDay, today),
    kmPerDay: Math.round(kmPerDay),
    lastKm,
    lastDate: lastDateText,
    lastDateShort: lastDateText.slice(0, 5),
    archived: vehicle.archivedAt !== null,
  };
}

export type VehicleView = ReturnType<typeof vehicleView>;
