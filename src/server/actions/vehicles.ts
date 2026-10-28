'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { odometerSummary } from '@/core/odometer';
import { validateReading } from '@/core/reading-validation';
import { calendarDayInBuenosAires, formatDate, formatKm } from '@/lib/format';
import {
  fieldErrors,
  formValues,
  optionalDate,
  optionalKm,
  optionalNumber,
  text,
  type FormState,
} from '@/server/actions/form';
import { requireUser } from '@/server/auth';
import { insertReading, listReadings } from '@/server/db/repos/odometer-readings';
import {
  getVehicle,
  insertVehicle,
  setArchived,
  setOdometer,
  updateVehicle as updateVehicleRepo,
} from '@/server/db/repos/vehicles';
import { ReadingInputSchema } from '@/server/db/schemas/odometer-reading';
import { VehicleInputSchema, VehicleUpdateSchema } from '@/server/db/schemas/vehicle';
import { withTransaction } from '@/server/db/transaction';

function vehicleFromForm(formData: FormData) {
  return {
    make: text(formData, 'make'),
    model: text(formData, 'model'),
    year: optionalNumber(formData, 'year'),
    version: text(formData, 'version'),
    fuel: text(formData, 'fuel') || undefined,
    km: optionalKm(formData, 'km'),
    alias: text(formData, 'alias'),
    plate: text(formData, 'plate'),
    purchaseDate: optionalDate(formData, 'purchaseDate'),
    defaultKmPerDay: optionalKm(formData, 'defaultKmPerDay'),
  };
}

// Alta (RF-03): el auto y su primera lectura de odómetro van juntos.
export async function createVehicle(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const { ownerId } = await requireUser();
  const parsed = VehicleInputSchema.safeParse(vehicleFromForm(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: formValues(formData) };

  const now = new Date();
  const today = calendarDayInBuenosAires(now);
  const { km, ...vehicle } = parsed.data;

  const id = await withTransaction(async (session) => {
    const vehicleId = await insertVehicle(
      {
        ...vehicle,
        ownerId,
        odometer: odometerSummary([{ date: today, km }], vehicle.defaultKmPerDay, today),
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      session,
    );
    await insertReading(
      {
        ownerId,
        vehicleId,
        date: today,
        km,
        odometerReset: false,
        source: 'onboarding',
        createdAt: now,
      },
      session,
    );
    return vehicleId;
  });

  revalidatePath('/', 'layout');
  redirect(`/autos/${id}`);
}

export async function updateVehicle(
  id: string,
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const { ownerId } = await requireUser();
  const parsed = VehicleUpdateSchema.safeParse(vehicleFromForm(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: formValues(formData) };

  const updated = await updateVehicleRepo(ownerId, id, parsed.data, new Date());
  if (!updated) return { errors: { form: 'No encontramos ese auto.' } };

  revalidatePath('/', 'layout');
  redirect(`/autos/${id}`);
}

// RF-04: archivado no genera alertas y conserva el historial.
export async function archiveVehicle(id: string): Promise<void> {
  const { ownerId } = await requireUser();
  const now = new Date();
  await setArchived(ownerId, id, now, now);
  revalidatePath('/', 'layout');
  redirect('/autos');
}

export async function unarchiveVehicle(id: string): Promise<void> {
  const { ownerId } = await requireUser();
  await setArchived(ownerId, id, null, new Date());
  revalidatePath('/', 'layout');
  redirect(`/autos/${id}`);
}

// Lectura rápida de odómetro (RF-15), con la validación de RN-07.
export async function addReading(
  vehicleId: string,
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const { ownerId } = await requireUser();
  const values = formValues(formData);
  const parsed = ReadingInputSchema.safeParse({
    km: optionalKm(formData, 'km'),
    date: optionalDate(formData, 'date'),
    odometerReset: formData.get('odometerReset') === 'on',
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const now = new Date();
  const today = calendarDayInBuenosAires(now);
  const reading = parsed.data;
  if (reading.date > today) return { errors: { date: 'La fecha no puede ser futura.' }, values };

  const vehicle = await getVehicle(ownerId, vehicleId);
  if (!vehicle) return { errors: { form: 'No encontramos ese auto.' }, values };

  const readings = await listReadings(ownerId, vehicleId);
  const validation = validateReading(readings, reading);
  if (!validation.ok) {
    const isLast = validation.reading === readings[0];
    const which = isLast
      ? 'la última lectura'
      : `la lectura del ${formatDate(validation.reading.date)}`;
    const comparison = validation.reason === 'below-previous' ? 'menor' : 'mayor';
    return {
      errors: { km: `Es ${comparison} que ${which} (${formatKm(validation.reading.km)} km).` },
      values,
      offerReset: validation.reason === 'below-previous',
    };
  }

  await withTransaction(async (session) => {
    await insertReading(
      { ...reading, ownerId, vehicleId, source: 'manual', createdAt: now },
      session,
    );
    const summary = odometerSummary([...readings, reading], vehicle.defaultKmPerDay, today);
    await setOdometer(ownerId, vehicleId, summary, now, session);
  });

  revalidatePath('/', 'layout');
  return { ok: true };
}
