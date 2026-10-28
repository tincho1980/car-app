import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ClipboardCheck, Ellipsis } from 'lucide-react';
import type { ItemState } from '@/core/types';
import { ItemRow } from '@/components/item-row';
import { OdometerCard } from '@/components/odometer-card';
import { Button } from '@/components/ui/button';
import { calendarDayInBuenosAires, toDateInput } from '@/lib/format';
import { vehicleView } from '@/lib/vehicle-view';
import { startPlan } from '@/server/actions/plan';
import { unarchiveVehicle } from '@/server/actions/vehicles';
import { requireUser } from '@/server/auth';
import { getVehicle, type Vehicle } from '@/server/db/repos/vehicles';
import { loadPlanStatus } from '@/server/plan/service';

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
          {vehicle.planApprovedAt ? (
            <Dues vehicle={vehicle} ownerId={ownerId} today={today} />
          ) : (
            <div className="mt-5 rounded-card border border-border bg-surface p-5">
              <p className="font-semibold">Todavía no hay plan de mantenimiento</p>
              <p className="mt-1 text-sm text-text-2">
                Te proponemos uno según el auto. Lo revisás y lo aprobás antes de que genere avisos.
              </p>
              <form action={startPlan.bind(null, id)} className="mt-5">
                <Button type="submit">
                  <ClipboardCheck />
                  Revisar plan
                </Button>
              </form>
            </div>
          )}
        </>
      )}
    </>
  );
}

const STATE_ORDER: Record<ItemState, number> = { overdue: 0, soon: 1, ok: 2, unknown: 3 };

// Vencimientos (frame 02): vencidos → próximos → OK → sin dato; dentro, lo más cercano primero.
async function Dues({
  vehicle,
  ownerId,
  today,
}: {
  vehicle: Vehicle;
  ownerId: string;
  today: Date;
}) {
  const status = await loadPlanStatus(ownerId, vehicle, today);
  const items = new Map(vehicle.plan.map((i) => [i.itemId, i]));
  const rows = [...status.items].sort(
    (a, b) =>
      STATE_ORDER[a.state] - STATE_ORDER[b.state] ||
      (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity),
  );
  const pending = vehicle.plan.filter((i) => i.active && i.initialDone === undefined).length;

  return (
    <section className="mt-6 flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">Vencimientos</h2>
        <Link href={`/autos/${vehicle.id}/plan`} className="text-sm font-semibold text-accent">
          Ver plan
        </Link>
      </div>
      {pending > 0 && (
        <Link
          href={`/autos/${vehicle.id}/plan/estado-inicial`}
          className="rounded-row bg-accent-soft p-4 text-sm"
        >
          <span className="font-semibold">
            Te {pending === 1 ? 'falta 1 ítem' : `faltan ${pending} ítems`} del último service.
          </span>{' '}
          <span className="text-accent">Completar</span>
        </Link>
      )}
      <ul className="flex flex-col gap-3">
        {rows.map((row) => {
          const item = items.get(row.itemId);
          return item && <ItemRow key={row.itemId} item={item} status={row} today={today} />;
        })}
      </ul>
    </section>
  );
}
