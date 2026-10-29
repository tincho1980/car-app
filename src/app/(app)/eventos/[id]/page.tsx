import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Pencil } from 'lucide-react';
import { DeleteEventButton } from '@/components/delete-event-button';
import { EventForm } from '@/components/event-form';
import { ItemIcon } from '@/components/item-icon';
import { buttonVariants } from '@/components/ui/button';
import { editEventDefaults, pickableItems } from '@/lib/event-form-defaults';
import {
  calendarDayInBuenosAires,
  formatDate,
  formatKm,
  formatMoney,
  toDateInput,
} from '@/lib/format';
import { vehicleView } from '@/lib/vehicle-view';
import { deleteEvent, updateEvent } from '@/server/actions/events';
import { requireUser } from '@/server/auth';
import { getEvent } from '@/server/db/repos/events';
import { getVehicle } from '@/server/db/repos/vehicles';
import { EVENT_TYPE_LABELS } from '@/server/db/schemas/event';

// Detalle de evento (docs/05): editar y eliminar. Comprobantes desde F08.
export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string }>;
}) {
  const { id } = await params;
  const { editar } = await searchParams;
  const { ownerId } = await requireUser();
  const event = await getEvent(ownerId, id);
  const vehicle = event && (await getVehicle(ownerId, event.vehicleId));
  if (!event || !vehicle) notFound();

  const today = calendarDayInBuenosAires(new Date());
  const view = vehicleView(vehicle, today);
  const noun = event.type === 'service' ? 'service' : 'trabajo';

  if (editar) {
    return (
      <EventForm
        action={updateEvent.bind(null, id)}
        vehicleTitle={view.title}
        items={pickableItems(vehicle)}
        defaults={editEventDefaults(event)}
        backHref={`/eventos/${id}`}
        isEdit
        today={toDateInput(today)}
      />
    );
  }

  const planItems = new Map(vehicle.plan.map((i) => [i.itemId, i]));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link
          href={`/autos/${vehicle.id}/historial`}
          aria-label="Volver al historial"
          className="flex size-11 items-center justify-center rounded-button border border-border bg-surface text-text"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold tracking-[0.8px] text-text-3 uppercase">
            {view.title}
          </p>
          <h1 className="text-2xl font-bold">{EVENT_TYPE_LABELS[event.type]}</h1>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 rounded-card border border-border bg-surface p-5">
        <Fact label="Fecha" value={formatDate(event.date)} />
        <Fact label="Km" value={`${formatKm(event.km)} km`} mono />
        <Fact
          label="Costo total"
          value={event.totalCost !== undefined ? formatMoney(event.totalCost) : '—'}
          mono
        />
        <Fact label="Taller" value={event.shop ?? '—'} />
      </section>

      {event.itemIds.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">Qué se hizo</h2>
          <ul className="flex flex-col gap-2">
            {event.itemIds.map((itemId) => {
              const item = planItems.get(itemId);
              return (
                <li key={itemId}>
                  <Link
                    href={`/autos/${vehicle.id}/historial/item/${itemId}`}
                    className="flex items-center gap-3 rounded-row border border-border bg-surface p-4"
                  >
                    {item && (
                      <ItemIcon
                        itemId={itemId}
                        category={item.category}
                        className="size-5 text-text-2"
                      />
                    )}
                    <span className="text-[15px] font-semibold">
                      {item?.name ?? 'Ítem que ya no está en el plan'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {event.parts.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">Repuestos</h2>
          <ul className="divide-y divide-border rounded-row border border-border bg-surface">
            {event.parts.map((part, i) => (
              <li key={i} className="flex items-start justify-between gap-3 p-4">
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold">
                    {part.qty > 1 && `${part.qty} × `}
                    {part.desc}
                  </span>
                  <span className="block text-sm text-text-2">
                    {[part.brand, part.partNumber].filter(Boolean).join(' · ')}
                  </span>
                </span>
                {part.unitPrice !== undefined && (
                  <span className="font-mono text-sm">{formatMoney(part.unitPrice)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {event.notes && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">Notas</h2>
          <p className="rounded-row border border-border bg-surface p-4 text-[15px] whitespace-pre-line">
            {event.notes}
          </p>
        </section>
      )}

      <div className="flex flex-col gap-3">
        <Link href={`/eventos/${id}?editar=1`} className={buttonVariants({ variant: 'secondary' })}>
          <Pencil />
          Editar
        </Link>
        <DeleteEventButton action={deleteEvent.bind(null, id)} noun={noun} />
      </div>
    </div>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">{label}</p>
      <p className={`mt-1 truncate text-base font-semibold ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
