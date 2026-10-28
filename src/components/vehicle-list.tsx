import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { formatKm } from '@/lib/format';
import type { VehicleView } from '@/lib/vehicle-view';

// Lista de autos (Inicio con 2+ autos y /autos). El semáforo por auto llega en F06.
export function VehicleList({ vehicles }: { vehicles: VehicleView[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {vehicles.map((vehicle) => (
        <li key={vehicle.id}>
          <Link
            href={`/autos/${vehicle.id}`}
            className="flex items-center gap-3 rounded-row border border-border bg-surface p-4"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold">{vehicle.title}</span>
              <span className="block truncate text-xs font-bold tracking-[0.8px] text-text-3 uppercase">
                {vehicle.subtitle}
              </span>
            </span>
            <span className="font-mono text-sm text-text-2">
              {vehicle.archived
                ? `${formatKm(vehicle.lastKm)} km`
                : `≈ ${formatKm(vehicle.estimatedKm)} km`}
            </span>
            <ChevronRight className="size-5 shrink-0 text-text-3" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
