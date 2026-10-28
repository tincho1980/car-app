'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { estimateLastDone } from '@/core/last-done';
import { calendarDayInBuenosAires } from '@/lib/format';
import {
  fieldErrors,
  formValues,
  optionalKm,
  optionalNumber,
  text,
  type FormState,
} from '@/server/actions/form';
import { requireUser } from '@/server/auth';
import { listReadings } from '@/server/db/repos/odometer-readings';
import { getDraftProposal, setProposalStatus } from '@/server/db/repos/plan-proposals';
import { getVehicle, type Vehicle } from '@/server/db/repos/vehicles';
import { PlanItemFieldsSchema, PlanItemInputSchema, type PlanItem } from '@/server/db/schemas/plan';
import { ensureDraftProposal, savePlan } from '@/server/plan/service';

async function ownedVehicle(vehicleId: string): Promise<{ ownerId: string; vehicle: Vehicle }> {
  const { ownerId } = await requireUser();
  const vehicle = await getVehicle(ownerId, vehicleId);
  if (!vehicle) throw new Error('No encontramos ese auto.');
  return { ownerId, vehicle };
}

function today(now: Date) {
  return calendarDayInBuenosAires(now);
}

// Desde el detalle de un auto sin plan: genera (o retoma) la propuesta y va a revisarla.
export async function startPlan(vehicleId: string): Promise<void> {
  const { ownerId, vehicle } = await ownedVehicle(vehicleId);
  if (vehicle.planApprovedAt) redirect(`/autos/${vehicleId}/plan`);
  await ensureDraftProposal(ownerId, vehicle, new Date());
  redirect(`/autos/${vehicleId}/plan/revisar`);
}

// Lo que cambia en la revisión. Zod no permite .pick() sobre un esquema con refinamientos:
// se arma desde los campos base y se repite la regla de "al menos un intervalo".
const ReviewItemSchema = PlanItemFieldsSchema.pick({ intervalKm: true, intervalMonths: true })
  .extend({ itemId: z.string().min(1), included: z.boolean(), verified: z.boolean() })
  .refine((i) => i.intervalKm !== undefined || i.intervalMonths !== undefined);

// RF-05 / RN-14: el plan recién genera alertas al aprobarlo. Los críticos incluidos tienen
// que estar verificados con el manual o el taller. Los descartados quedan como "no aplica".
export async function approvePlan(
  vehicleId: string,
  reviewed: unknown,
): Promise<{ error?: string }> {
  const { ownerId, vehicle } = await ownedVehicle(vehicleId);
  if (vehicle.planApprovedAt) return { error: 'Este auto ya tiene un plan aprobado.' };

  const proposal = await getDraftProposal(ownerId, vehicleId);
  if (!proposal) return { error: 'No encontramos la propuesta. Volvé a abrir el plan.' };

  const parsed = z.array(ReviewItemSchema).safeParse(reviewed);
  if (!parsed.success) return { error: 'Revisá los intervalos: cada ítem necesita km o meses.' };
  const review = new Map(parsed.data.map((i) => [i.itemId, i]));

  const now = new Date();
  const plan: PlanItem[] = [];
  for (const proposed of proposal.items) {
    const r = review.get(proposed.itemId);
    if (!r) return { error: 'La propuesta cambió. Volvé a abrir el plan.' };
    if (proposed.critical && r.included && !r.verified) {
      return { error: `Tildá "Verificado" en ${proposed.name}.` };
    }
    const edited =
      r.intervalKm !== proposed.intervalKm || r.intervalMonths !== proposed.intervalMonths;
    plan.push({
      itemId: proposed.itemId,
      name: proposed.name,
      category: proposed.category,
      intervalKm: r.intervalKm,
      intervalMonths: r.intervalMonths,
      warnKm: proposed.warnKm,
      warnDays: proposed.warnDays,
      critical: proposed.critical,
      note: proposed.note,
      active: r.included,
      origin: proposal.origin,
      edited,
      verifiedAt: proposed.critical && r.verified ? now : undefined,
      approvedAt: now,
    });
  }

  await savePlan(ownerId, vehicle, plan, today(now), now, now);
  await setProposalStatus(ownerId, proposal.id, 'approved', now);
  revalidatePath('/', 'layout');
  redirect(`/autos/${vehicleId}/plan/estado-inicial`);
}

// Estado inicial (RF-08): fecha (mes/año) y/o km del último realizado, o "No sé".
export async function setInitialDone(
  vehicleId: string,
  itemId: string,
  step: number,
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const { ownerId, vehicle } = await ownedVehicle(vehicleId);
  const now = new Date();
  const values = formValues(formData);
  const unknown = formData.get('answer') === 'unknown';

  let initialDone: PlanItem['initialDone'] = null;
  if (!unknown) {
    const month = text(formData, 'month');
    const date = /^\d{4}-\d{2}$/.test(month) ? new Date(`${month}-01T00:00:00Z`) : undefined;
    const km = optionalKm(formData, 'km');
    if (!date && km === undefined) {
      return {
        errors: { form: 'Completá la fecha, los km o los dos. Si no sabés, tocá "No sé".' },
        values,
      };
    }
    if (date && (date > today(now) || date.getUTCFullYear() < 1950)) {
      return { errors: { month: 'Revisá la fecha.' }, values };
    }
    if (km !== undefined && km > vehicle.odometer.lastKm) {
      return { errors: { km: 'Es más que los km actuales del auto.' }, values };
    }
    const readings = await listReadings(ownerId, vehicleId);
    initialDone = estimateLastDone(readings, { date, km }, vehicle.odometer.kmPerDay) ?? null;
  }

  const plan = vehicle.plan.map((item) =>
    item.itemId === itemId ? { ...item, initialDone } : item,
  );
  await savePlan(ownerId, vehicle, plan, today(now), now);
  revalidatePath('/', 'layout');

  const total = vehicle.plan.filter((i) => i.active).length;
  redirect(
    step >= total
      ? `/autos/${vehicleId}`
      : `/autos/${vehicleId}/plan/estado-inicial?item=${step + 1}`,
  );
}

// "Saltar todos": lo que falta queda como desconocido ("Sin dato").
export async function skipRemainingInitial(vehicleId: string): Promise<void> {
  const { ownerId, vehicle } = await ownedVehicle(vehicleId);
  const now = new Date();
  const plan = vehicle.plan.map((item) =>
    item.active && item.initialDone === undefined ? { ...item, initialDone: null } : item,
  );
  await savePlan(ownerId, vehicle, plan, today(now), now);
  revalidatePath('/', 'layout');
  redirect(`/autos/${vehicleId}`);
}

// Editar un ítem del plan o agregar uno propio (RF-06, RF-07).
export async function savePlanItem(
  vehicleId: string,
  itemId: string | null,
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const { ownerId, vehicle } = await ownedVehicle(vehicleId);
  const values = formValues(formData);
  const parsed = PlanItemInputSchema.safeParse({
    name: text(formData, 'name'),
    category: text(formData, 'category') || undefined,
    intervalKm: optionalKm(formData, 'intervalKm'),
    intervalMonths: optionalNumber(formData, 'intervalMonths'),
    warnKm: optionalKm(formData, 'warnKm'),
    warnDays: optionalNumber(formData, 'warnDays'),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const now = new Date();
  const fields = parsed.data;
  const plan: PlanItem[] = itemId
    ? vehicle.plan.map((item) =>
        item.itemId === itemId
          ? {
              ...item,
              ...fields,
              // Sin el undefined explícito, quitar un intervalo no lo borraría.
              intervalKm: fields.intervalKm,
              intervalMonths: fields.intervalMonths,
              edited: true,
            }
          : item,
      )
    : [
        ...vehicle.plan,
        {
          ...fields,
          itemId: `propio-${randomUUID().slice(0, 8)}`,
          critical: false,
          active: true,
          origin: 'manual',
          edited: false,
          approvedAt: now,
        },
      ];

  await savePlan(ownerId, vehicle, plan, today(now), now);
  revalidatePath('/', 'layout');
  return { ok: true };
}

// "No aplica" (RN-10): no genera estado ni alertas, pero se conserva.
export async function setItemActive(
  vehicleId: string,
  itemId: string,
  active: boolean,
): Promise<void> {
  const { ownerId, vehicle } = await ownedVehicle(vehicleId);
  const now = new Date();
  const plan = vehicle.plan.map((item) => (item.itemId === itemId ? { ...item, active } : item));
  await savePlan(ownerId, vehicle, plan, today(now), now);
  revalidatePath('/', 'layout');
}
