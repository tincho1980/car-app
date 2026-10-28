import 'server-only';
import { planWithStatus } from '@/lib/plan-status';
import type { PlanItem } from '@/server/db/schemas/plan';
import { listReadings } from '@/server/db/repos/odometer-readings';
import { getDraftProposal, insertProposal } from '@/server/db/repos/plan-proposals';
import { setPlan, type Vehicle } from '@/server/db/repos/vehicles';
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

// Guarda el plan con su estado recalculado (eventos desde F05).
export async function savePlan(
  ownerId: string,
  vehicle: Vehicle,
  plan: PlanItem[],
  today: Date,
  now: Date,
  approvedAt?: Date,
): Promise<void> {
  const readings = await listReadings(ownerId, vehicle.id);
  const { plan: withStatus } = planWithStatus(plan, readings, [], vehicle.defaultKmPerDay, today);
  await setPlan(ownerId, vehicle.id, withStatus, now, approvedAt);
}

// Estado en vivo para mostrar (km estimado de hoy).
export async function loadPlanStatus(ownerId: string, vehicle: Vehicle, today: Date) {
  const readings = await listReadings(ownerId, vehicle.id);
  return planWithStatus(vehicle.plan, readings, [], vehicle.defaultKmPerDay, today).status;
}
