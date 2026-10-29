import 'server-only';
import { odometerSummary } from '@/core/odometer';
import { planWithStatus } from '@/lib/plan-status';
import type { PlanItem } from '@/server/db/schemas/plan';
import { listEvents } from '@/server/db/repos/events';
import { listReadings } from '@/server/db/repos/odometer-readings';
import { getDraftProposal, insertProposal } from '@/server/db/repos/plan-proposals';
import { getVehicle, setOdometer, setPlan, type Vehicle } from '@/server/db/repos/vehicles';
import { templateProposer, type PlanProposer } from '@/server/plan/proposer';

// Devuelve el id de la propuesta en borrador del auto, y la genera si no hay (RF-05).
export async function ensureDraftProposal(
  ownerId: string,
  vehicle: Vehicle,
  now: Date,
  proposer: PlanProposer = templateProposer,
): Promise<string> {
  const existing = await getDraftProposal(ownerId, vehicle.id);
  if (existing) return existing.id;

  const proposed = await proposer.propose(vehicle);
  return insertProposal({
    ownerId,
    vehicleId: vehicle.id,
    status: 'draft',
    ...proposed,
    createdAt: now,
    updatedAt: now,
  });
}

// Guarda el plan con su estado recalculado desde lecturas y eventos (RN-09).
export async function savePlan(
  ownerId: string,
  vehicle: Vehicle,
  plan: PlanItem[],
  today: Date,
  now: Date,
  approvedAt?: Date,
): Promise<void> {
  const [readings, events] = await Promise.all([
    listReadings(ownerId, vehicle.id),
    listEvents(ownerId, vehicle.id),
  ]);
  const { plan: withStatus } = planWithStatus(
    plan,
    readings,
    events,
    vehicle.defaultKmPerDay,
    today,
  );
  await setPlan(ownerId, vehicle.id, withStatus, now, approvedAt);
}

// Estado en vivo para mostrar (km estimado de hoy).
export async function loadPlanStatus(ownerId: string, vehicle: Vehicle, today: Date) {
  const [readings, events] = await Promise.all([
    listReadings(ownerId, vehicle.id),
    listEvents(ownerId, vehicle.id),
  ]);
  return planWithStatus(vehicle.plan, readings, events, vehicle.defaultKmPerDay, today).status;
}

// Después de crear, editar o borrar un evento: resumen del odómetro y caché del plan.
export async function recalculateVehicle(
  ownerId: string,
  vehicleId: string,
  today: Date,
  now: Date,
): Promise<void> {
  const vehicle = await getVehicle(ownerId, vehicleId);
  if (!vehicle) return;
  const readings = await listReadings(ownerId, vehicleId);
  if (readings.length > 0) {
    await setOdometer(
      ownerId,
      vehicleId,
      odometerSummary(readings, vehicle.defaultKmPerDay, today),
      now,
    );
  }
  await savePlan(ownerId, vehicle, vehicle.plan, today, now);
}
