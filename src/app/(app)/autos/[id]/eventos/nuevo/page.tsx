import { notFound } from 'next/navigation';
import { EventForm } from '@/components/event-form';
import { newEventDefaults, pickableItems } from '@/lib/event-form-defaults';
import { calendarDayInBuenosAires, toDateInput } from '@/lib/format';
import { vehicleView } from '@/lib/vehicle-view';
import { createEvent } from '@/server/actions/events';
import { requireUser } from '@/server/auth';
import { getVehicle } from '@/server/db/repos/vehicles';

// Registrar service o trabajo (frame 08). ?items=a,b precarga los ítems del plan.
export default async function NewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ items?: string }>;
}) {
  const { id } = await params;
  const { items } = await searchParams;
  const { ownerId } = await requireUser();
  const vehicle = await getVehicle(ownerId, id);
  if (!vehicle) notFound();

  const today = calendarDayInBuenosAires(new Date());
  const view = vehicleView(vehicle, today);
  const pickable = pickableItems(vehicle);
  const valid = new Set(pickable.map((i) => i.itemId));
  const preselected = (items ?? '').split(',').filter((itemId) => valid.has(itemId));

  return (
    <EventForm
      action={createEvent.bind(null, id)}
      vehicleTitle={view.title}
      items={pickable}
      defaults={newEventDefaults(today, view.estimatedKm, preselected)}
      backHref={`/autos/${id}`}
      today={toDateInput(today)}
    />
  );
}
