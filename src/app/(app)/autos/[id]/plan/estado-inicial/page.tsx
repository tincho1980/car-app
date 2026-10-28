import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { InitialStateForm } from '@/components/initial-state-form';
import { calendarDayInBuenosAires, toDateInput } from '@/lib/format';
import { lastDoneQuestion } from '@/lib/plan-items';
import { setInitialDone, skipRemainingInitial } from '@/server/actions/plan';
import { requireUser } from '@/server/auth';
import { getVehicle } from '@/server/db/repos/vehicles';

// Wizard "¿cuándo se hizo por última vez?" (frame 07, RF-08). Un ítem activo por paso.
export default async function InitialStatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ item?: string }>;
}) {
  const { id } = await params;
  const { item: itemParam } = await searchParams;
  const { ownerId } = await requireUser();
  const vehicle = await getVehicle(ownerId, id);
  if (!vehicle) notFound();
  if (!vehicle.planApprovedAt) redirect(`/autos/${id}/plan/revisar`);

  const items = vehicle.plan.filter((i) => i.active);
  if (items.length === 0) redirect(`/autos/${id}`);

  // Sin ?item= arranca por el primero que todavía no se contestó.
  const firstPending = items.findIndex((i) => i.initialDone === undefined) + 1;
  const step = Math.min(Math.max(Number(itemParam) || firstPending || 1, 1), items.length);
  const item = items[step - 1];
  const done = item.initialDone;
  const today = calendarDayInBuenosAires(new Date());

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link
          href={step > 1 ? `/autos/${id}/plan/estado-inicial?item=${step - 1}` : `/autos/${id}`}
          aria-label="Volver"
          className="flex size-11 items-center justify-center rounded-button border border-border bg-surface text-text"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <div>
          <p className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">
            Paso 3 de 3 · Ítem {step} de {items.length}
          </p>
          <h1 className="text-2xl font-bold">Último service</h1>
        </div>
      </header>

      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${(step / items.length) * 100}%` }}
        />
      </div>

      <InitialStateForm
        key={item.itemId}
        action={setInitialDone.bind(null, id, item.itemId, step)}
        itemId={item.itemId}
        category={item.category}
        critical={item.critical}
        question={lastDoneQuestion(item.itemId, item.name)}
        defaultMonth={done ? toDateInput(done.date).slice(0, 7) : undefined}
        defaultKm={done ? String(done.km) : undefined}
        maxMonth={toDateInput(today).slice(0, 7)}
      />

      <form action={skipRemainingInitial.bind(null, id)}>
        <button type="submit" className="w-full py-2 text-[15px] font-semibold text-text-2">
          Saltar todos (marcar como desconocidos)
        </button>
      </form>
    </div>
  );
}
