import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, SlidersHorizontal } from 'lucide-react';
import { itemHistory } from '@/core/item-history';
import { buttonVariants } from '@/components/ui/button';
import { formatDate, formatKm } from '@/lib/format';
import { formatInterval } from '@/lib/plan-items';
import { requireUser } from '@/server/auth';
import { listEvents } from '@/server/db/repos/events';
import { getVehicle } from '@/server/db/repos/vehicles';

// Historial de un ítem (RF-28): cada vez que se hizo, los km entre cambios y el promedio.
export default async function ItemHistoryPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const { ownerId } = await requireUser();
  const vehicle = await getVehicle(ownerId, id);
  const item = vehicle?.plan.find((i) => i.itemId === itemId);
  if (!vehicle || !item) notFound();

  const events = await listEvents(ownerId, id, { itemId });
  const { entries, averageKm } = itemHistory(events, itemId, item.initialDone);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link
          href={`/autos/${id}/historial?item=${itemId}`}
          aria-label="Volver al historial"
          className="flex size-11 items-center justify-center rounded-button border border-border bg-surface text-text"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold tracking-[0.8px] text-text-3 uppercase">
            Historial del ítem
          </p>
          <h1 className="truncate text-2xl font-bold">{item.name}</h1>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 rounded-card border border-border bg-surface p-5">
        <div>
          <p className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">Plan</p>
          <p className="mt-1 font-mono text-base font-semibold">{formatInterval(item)}</p>
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">Promedio real</p>
          <p className="mt-1 font-mono text-base font-semibold">
            {averageKm !== undefined ? `~${formatKm(averageKm)} km` : '—'}
          </p>
        </div>
      </section>

      {entries.length === 0 ? (
        <p className="text-sm text-text-2">Todavía no hay registros de este ítem.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => {
            const body = (
              <>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold">{formatDate(entry.date)}</span>
                  <span className="block text-sm text-text-2">
                    {entry.eventId ? 'Registrado' : 'Estado inicial'}
                    {entry.kmSincePrevious !== undefined &&
                      ` · ${formatKm(entry.kmSincePrevious)} km desde el anterior`}
                  </span>
                </span>
                <span className="font-mono text-sm">{formatKm(entry.km)} km</span>
              </>
            );
            const className =
              'flex items-center justify-between gap-3 rounded-row border border-border bg-surface p-4';
            return (
              <li key={entry.eventId ?? 'inicial'}>
                {entry.eventId ? (
                  <Link href={`/eventos/${entry.eventId}`} className={className}>
                    {body}
                  </Link>
                ) : (
                  <div className={className}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Link href={`/autos/${id}/plan`} className={buttonVariants({ variant: 'secondary' })}>
        <SlidersHorizontal />
        Ajustar intervalo
      </Link>
    </div>
  );
}
