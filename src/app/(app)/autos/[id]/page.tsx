import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Ellipsis } from 'lucide-react';
import { OdometerCard } from '@/components/odometer-card';
import { Button } from '@/components/ui/button';
import { calendarDayInBuenosAires, toDateInput } from '@/lib/format';
import { vehicleView } from '@/lib/vehicle-view';
import { unarchiveVehicle } from '@/server/actions/vehicles';
import { requireUser } from '@/server/auth';
import { getVehicle } from '@/server/db/repos/vehicles';

// Detalle del auto (frame 02). En F03, el encabezado con el km estimado; los vencimientos
// llegan con el plan (F04 a F06).
export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ownerId } = await requireUser();
  const vehicle = await getVehicle(ownerId, id);
  if (!vehicle) notFound();

  const today = calendarDayInBuenosAires(new Date());
  const view = vehicleView(vehicle, today);

  return (
    <>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold tracking-[0.8px] text-text-3 uppercase">
            {view.subtitle}
          </p>
          <h1 className="truncate text-2xl font-bold">{view.title}</h1>
        </div>
        <Link
          href={`/autos/${id}/editar`}
          aria-label="Editar auto"
          className="flex size-11 shrink-0 items-center justify-center rounded-button border border-border bg-surface text-text"
        >
          <Ellipsis className="size-5" />
        </Link>
      </header>

      {view.archived ? (
        <div className="mt-5 rounded-card border border-border bg-surface p-5">
          <p className="font-semibold">Este auto está archivado</p>
          <p className="mt-1 text-sm text-text-2">
            No genera alertas. Último km registrado: {view.lastKm.toLocaleString('es-AR')} el{' '}
            {view.lastDate}.
          </p>
          <form action={unarchiveVehicle.bind(null, id)} className="mt-5">
            <Button type="submit" variant="secondary">
              Reactivar
            </Button>
          </form>
        </div>
      ) : (
        <>
          <div className="mt-5">
            <OdometerCard
              vehicleId={id}
              estimatedKm={view.estimatedKm}
              kmPerDay={view.kmPerDay}
              lastKm={view.lastKm}
              lastDate={view.lastDate}
              lastDateShort={view.lastDateShort}
              today={toDateInput(today)}
            />
          </div>
          <div className="mt-5 rounded-card border border-border bg-surface p-5">
            <p className="font-semibold">Todavía no hay plan de mantenimiento</p>
            <p className="mt-1 text-sm text-text-2">
              Cuando lo armes, acá vas a ver qué le toca al auto y cuándo.
            </p>
          </div>
        </>
      )}
    </>
  );
}
