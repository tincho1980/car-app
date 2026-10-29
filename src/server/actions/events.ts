'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { validateReading } from '@/core/reading-validation';
import { calendarDayInBuenosAires, formatDate, formatKm, parseMoney } from '@/lib/format';
import {
  fieldErrors,
  formValues,
  optionalDate,
  optionalKm,
  text,
  type FormState,
} from '@/server/actions/form';
import { requireUser } from '@/server/auth';
import {
  deleteEvent as deleteEventRepo,
  getEvent,
  insertEvent,
  updateEvent as updateEventRepo,
} from '@/server/db/repos/events';
import {
  deleteReadingOfEvent,
  insertReading,
  listReadings,
  updateReadingOfEvent,
} from '@/server/db/repos/odometer-readings';
import { getVehicle, type Vehicle } from '@/server/db/repos/vehicles';
import { EventInputSchema, type EventInput } from '@/server/db/schemas/event';
import { withTransaction } from '@/server/db/transaction';
import { recalculateVehicle } from '@/server/plan/service';

function eventFromForm(formData: FormData) {
  let parts: unknown = [];
  try {
    parts = JSON.parse(text(formData, 'parts') || '[]');
  } catch {
    parts = [];
  }
  return {
    type: text(formData, 'type') || undefined,
    itemIds: formData.getAll('itemIds').filter((v): v is string => typeof v === 'string'),
    date: optionalDate(formData, 'date'),
    km: optionalKm(formData, 'km'),
    totalCost: parseMoney(text(formData, 'totalCost')),
    shop: text(formData, 'shop').trim() || undefined,
    parts,
    notes: text(formData, 'notes').trim() || undefined,
  };
}

// Valida lo que no cubre Zod: fecha no futura, ítems del plan y RN-07 contra las demás lecturas.
async function validateEvent(
  ownerId: string,
  vehicle: Vehicle,
  event: EventInput,
  ownEventId?: string,
): Promise<Record<string, string> | null> {
  const today = calendarDayInBuenosAires(new Date());
  if (event.date > today) return { date: 'La fecha no puede ser futura.' };

  const planIds = new Set(vehicle.plan.map((i) => i.itemId));
  if (event.itemIds.some((id) => !planIds.has(id))) {
    return { form: 'Hay un ítem que ya no está en el plan. Volvé a elegirlos.' };
  }

  const readings = (await listReadings(ownerId, vehicle.id)).filter(
    (r) => !ownEventId || r.eventId !== ownEventId,
  );
  const validation = validateReading(readings, { date: event.date, km: event.km });
  if (!validation.ok) {
    const comparison = validation.reason === 'below-previous' ? 'menor' : 'mayor';
    return {
      km: `Es ${comparison} que la lectura del ${formatDate(validation.reading.date)} (${formatKm(validation.reading.km)} km). Si cambiaste el tablero, cargalo desde "Cargar km".`,
    };
  }
  return null;
}

// Registrar un evento (RF-09): guarda el evento y su lectura de odómetro, y recalcula todo.
export async function createEvent(
  vehicleId: string,
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const { ownerId } = await requireUser();
  const values = formValues(formData);
  const vehicle = await getVehicle(ownerId, vehicleId);
  if (!vehicle) return { errors: { form: 'No encontramos ese auto.' }, values };

  const parsed = EventInputSchema.safeParse(eventFromForm(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const errors = await validateEvent(ownerId, vehicle, parsed.data);
  if (errors) return { errors, values };

  const now = new Date();
  const eventId = await withTransaction(async (session) => {
    const id = await insertEvent(
      {
        ...parsed.data,
        ownerId,
        vehicleId,
        currency: 'ARS',
        attachments: [],
        source: 'manual',
        createdAt: now,
        updatedAt: now,
      },
      session,
    );
    await insertReading(
      {
        ownerId,
        vehicleId,
        date: parsed.data.date,
        km: parsed.data.km,
        odometerReset: false,
        source: 'event',
        eventId: id,
        createdAt: now,
      },
      session,
    );
    return id;
  });

  await recalculateVehicle(ownerId, vehicleId, calendarDayInBuenosAires(now), now);
  revalidatePath('/', 'layout');
  redirect(`/autos/${vehicleId}?evento=${eventId}`);
}

// Editar (RF-10): el evento y su lectura cambian juntos; después se recalcula.
export async function updateEvent(
  eventId: string,
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const { ownerId } = await requireUser();
  const values = formValues(formData);
  const event = await getEvent(ownerId, eventId);
  const vehicle = event && (await getVehicle(ownerId, event.vehicleId));
  if (!event || !vehicle) return { errors: { form: 'No encontramos ese evento.' }, values };

  const parsed = EventInputSchema.safeParse(eventFromForm(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const errors = await validateEvent(ownerId, vehicle, parsed.data, eventId);
  if (errors) return { errors, values };

  const now = new Date();
  await withTransaction(async (session) => {
    await updateEventRepo(ownerId, eventId, parsed.data, now, session);
    await updateReadingOfEvent(
      ownerId,
      eventId,
      { date: parsed.data.date, km: parsed.data.km },
      session,
    );
  });

  await recalculateVehicle(ownerId, vehicle.id, calendarDayInBuenosAires(now), now);
  revalidatePath('/', 'layout');
  redirect(`/eventos/${eventId}`);
}

async function removeEvent(eventId: string): Promise<string | null> {
  const { ownerId } = await requireUser();
  const event = await getEvent(ownerId, eventId);
  if (!event) return null;

  const now = new Date();
  await withTransaction(async (session) => {
    await deleteEventRepo(ownerId, eventId, session);
    await deleteReadingOfEvent(ownerId, eventId, session);
  });
  await recalculateVehicle(ownerId, event.vehicleId, calendarDayInBuenosAires(now), now);
  revalidatePath('/', 'layout');
  return event.vehicleId;
}

// Eliminar (RF-10, con confirmación en la pantalla): todo vuelve a como estaba antes.
export async function deleteEvent(eventId: string): Promise<void> {
  const vehicleId = await removeEvent(eventId);
  redirect(vehicleId ? `/autos/${vehicleId}/historial` : '/');
}

// "Deshacer" del toast (frame 09): borra el evento recién guardado.
export async function undoEvent(eventId: string): Promise<void> {
  const vehicleId = await removeEvent(eventId);
  if (vehicleId) redirect(`/autos/${vehicleId}`);
}
