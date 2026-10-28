import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PlanEditor } from '@/components/plan-editor';
import { calendarDayInBuenosAires } from '@/lib/format';
import { requireUser } from '@/server/auth';
import { getVehicle } from '@/server/db/repos/vehicles';
import { loadPlanStatus } from '@/server/plan/service';

// Plan aprobado (docs/05): intervalo, origen y estado de cada ítem; editar y agregar.
export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ownerId } = await requireUser();
  const vehicle = await getVehicle(ownerId, id);
  if (!vehicle) notFound();
  if (!vehicle.planApprovedAt) redirect(`/autos/${id}/plan/revisar`);

  const status = await loadPlanStatus(ownerId, vehicle, calendarDayInBuenosAires(new Date()));
  const states = new Map(status.items.map((s) => [s.itemId, s.state]));
  const title = vehicle.alias ?? `${vehicle.make} ${vehicle.model}`;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link
          href={`/autos/${id}`}
          aria-label="Volver"
          className="flex size-11 items-center justify-center rounded-button border border-border bg-surface text-text"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <h1 className="truncate text-2xl font-bold">Plan de {title}</h1>
      </header>
      <PlanEditor
        vehicleId={id}
        items={vehicle.plan.map((item) => ({
          itemId: item.itemId,
          name: item.name,
          category: item.category,
          intervalKm: item.intervalKm,
          intervalMonths: item.intervalMonths,
          warnKm: item.warnKm,
          warnDays: item.warnDays,
          critical: item.critical,
          active: item.active,
          origin: item.origin,
          note: item.note,
          state: states.get(item.itemId),
        }))}
      />
    </div>
  );
}
