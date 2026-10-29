import Link from 'next/link';
import { notFound } from 'next/navigation';
import { X } from 'lucide-react';
import { cn } from 'cn';
import { HistoryFilters } from '@/components/history-filters';
import { formatDate, formatKm, formatMoney, parseDateInput } from '@/lib/format';
import { requireUser } from '@/server/auth';
import { listEvents, type MaintenanceEventRecord } from '@/server/db/repos/events';
import { getVehicle } from '@/server/db/repos/vehicles';
import { EVENT_TYPE_LABELS, EVENT_TYPES, type EventType } from '@/server/db/schemas/event';

// Color del punto de cada tipo en el timeline (frame 10).
const TYPE_DOT: Record<EventType, string> = {
  service: 'bg-accent',
  preventivo: 'bg-accent',
  reparacion: 'bg-danger',
  neumaticos: 'bg-ok',
  frenos: 'bg-warn',
  otro: 'bg-muted',
};

type Search = { tipo?: string; item?: string; desde?: string; hasta?: string };

// Historial del auto (frame 10, RF-27): timeline por año, filtrable por tipo, ítem y fechas.
export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Search>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const { ownerId } = await requireUser();
  const vehicle = await getVehicle(ownerId, id);
  if (!vehicle) notFound();

  const type = EVENT_TYPES.find((t) => t === search.tipo);
  const events = await listEvents(ownerId, id, {
    type,
    itemId: search.item || undefined,
    from: search.desde ? parseDateInput(search.desde) : undefined,
    to: search.hasta ? parseDateInput(search.hasta) : undefined,
  });
  const itemNames = new Map(vehicle.plan.map((i) => [i.itemId, i.name]));
  const filteredItem = search.item ? itemNames.get(search.item) : undefined;
  const years = groupByYear(events);
  const title = vehicle.alias ?? `${vehicle.make} ${vehicle.model}`;

  const href = (next: Search) => {
    const query = new URLSearchParams(
      Object.entries({ ...search, ...next }).filter((e): e is [string, string] => Boolean(e[1])),
    ).toString();
    return `/autos/${id}/historial${query ? `?${query}` : ''}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/autos/${id}`}
            className="block truncate text-xs font-bold tracking-[0.8px] text-text-3 uppercase"
          >
            {title}
          </Link>
          <h1 className="text-2xl font-bold">Historial</h1>
        </div>
        <HistoryFilters
          items={vehicle.plan.map((i) => ({ itemId: i.itemId, name: i.name }))}
          current={search}
        />
      </header>

      <nav className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Tipo">
        <TypeChip href={href({ tipo: undefined })} selected={!type}>
          Todos
        </TypeChip>
        {EVENT_TYPES.map((t) => (
          <TypeChip key={t} href={href({ tipo: t })} selected={type === t}>
            {EVENT_TYPE_LABELS[t]}
          </TypeChip>
        ))}
      </nav>

      {(filteredItem || search.desde || search.hasta) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {filteredItem && (
            <Link
              href={`/autos/${id}/historial/item/${search.item}`}
              className="font-semibold text-accent"
            >
              Ver el historial de {filteredItem.toLowerCase()}
            </Link>
          )}
          <Link
            href={href({ item: undefined, desde: undefined, hasta: undefined })}
            className="ml-auto flex items-center gap-1 text-text-2"
          >
            <X className="size-4" />
            Quitar filtros
          </Link>
        </div>
      )}

      {years.length === 0 ? (
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="font-semibold">Todavía no hay nada acá</p>
          <p className="mt-1 text-sm text-text-2">
            Cuando registres un service o un trabajo, aparece en este historial.
          </p>
        </div>
      ) : (
        years.map(({ year, events: yearEvents, total }) => (
          <section key={year} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-bold">{year}</h2>
              {total > 0 && (
                <span className="font-mono text-sm font-semibold text-text-2">
                  Total {formatMoney(total)}
                </span>
              )}
            </div>
            <ul className="flex flex-col gap-3">
              {yearEvents.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <span
                    className={cn('mt-5 size-2.5 shrink-0 rounded-full', TYPE_DOT[event.type])}
                    aria-hidden
                  />
                  <Link
                    href={`/eventos/${event.id}`}
                    className="min-w-0 flex-1 rounded-row border border-border bg-surface p-4"
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-text-2">
                        {formatDate(event.date)}
                      </span>
                      <span className="font-mono text-sm text-text-2">{formatKm(event.km)} km</span>
                    </span>
                    <span className="mt-1 block text-lg font-bold">
                      {EVENT_TYPE_LABELS[event.type]}
                    </span>
                    <span className="block truncate text-sm text-text-2">
                      {summary(event, itemNames)}
                    </span>
                    <span className="mt-2 flex items-baseline justify-between gap-2">
                      <span className="font-mono text-base font-bold">
                        {event.totalCost !== undefined ? formatMoney(event.totalCost) : '—'}
                      </span>
                      {event.shop && (
                        <span className="truncate text-sm text-text-3">{event.shop}</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function TypeChip({
  href,
  selected,
  children,
}: {
  href: string;
  selected: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? 'page' : undefined}
      className={cn(
        'inline-flex h-11 shrink-0 items-center rounded-full border px-4 text-[15px] font-semibold',
        selected
          ? 'border-accent bg-accent text-primary-foreground'
          : 'border-border bg-surface text-text',
      )}
    >
      {children}
    </Link>
  );
}

// Qué se hizo: los ítems del plan o, si no hay, el primer repuesto o las notas.
function summary(event: MaintenanceEventRecord, names: Map<string, string>): string {
  const items = event.itemIds.map((id) => names.get(id)).filter(Boolean);
  if (items.length > 0) return items.join(' · ');
  return event.parts[0]?.desc ?? event.notes ?? 'Sin detalle';
}

function groupByYear(events: MaintenanceEventRecord[]) {
  const years = new Map<number, MaintenanceEventRecord[]>();
  for (const event of events) {
    const year = event.date.getUTCFullYear();
    years.set(year, [...(years.get(year) ?? []), event]);
  }
  return [...years.entries()].map(([year, list]) => ({
    year,
    events: list,
    total: list.reduce((sum, e) => sum + (e.totalCost ?? 0), 0),
  }));
}
