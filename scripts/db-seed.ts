// Carga el Palio de ejemplo con lecturas de los últimos meses (~50 km/día) y plan aprobado.
// Solo corre sobre una base -dev: nunca toca los datos reales.
import { addDays } from '@/core/dates';
import { estimateLastDone } from '@/core/last-done';
import { odometerSummary } from '@/core/odometer';
import { env } from '@/env';
import { calendarDayInBuenosAires } from '@/lib/format';
import { client, db } from '@/server/db/client';
import { insertReading } from '@/server/db/repos/odometer-readings';
import { getVehicle, insertVehicle } from '@/server/db/repos/vehicles';
import type { PlanItem } from '@/server/db/schemas/plan';
import { templateProposer } from '@/server/plan/proposer';
import { savePlan } from '@/server/plan/service';

const ALIAS = 'El Palio';
const KM_PER_DAY = 50;
const DAYS_AGO = [180, 120, 60, 10];
const KM_TODAY = 120_000;

// Último realizado de cada ítem (mes y/o km). Los que no están quedan "Sin dato".
const INITIAL: Record<string, { month?: string; km?: number }> = {
  'aceite-filtro': { month: '2026-01', km: 111_000 }, // próximo por km
  rotacion: { km: 110_500 }, // próximo, con la fecha estimada
  'correa-distribucion': { month: '2023-03', km: 82_000 }, // caso de referencia
  'liquido-frenos': { month: '2024-08' }, // vencido por tiempo
  'filtro-aire': { month: '2025-11', km: 112_000 },
  refrigerante: { km: 100_000 },
  bujias: { month: '2024-06', km: 95_000 },
  pastillas: { month: '2026-01', km: 104_000 },
  alineacion: { month: '2026-05', km: 113_000 },
};

async function main() {
  if (!env.MONGODB_DB.endsWith('-dev')) {
    throw new Error(
      `db:seed solo corre sobre una base -dev (MONGODB_DB=${env.MONGODB_DB}). Revisá .env.local.`,
    );
  }

  const ownerId = env.ALLOWED_EMAIL;
  const now = new Date();
  const today = calendarDayInBuenosAires(now);

  // Idempotente: borra el Palio sembrado antes (y sus lecturas) y lo vuelve a crear.
  const previous = await db.collection('vehicles').find({ ownerId, alias: ALIAS }).toArray();
  for (const vehicle of previous) {
    await db.collection('odometerReadings').deleteMany({ vehicleId: vehicle._id.toString() });
    await db.collection('vehicles').deleteOne({ _id: vehicle._id });
  }

  const readings = DAYS_AGO.map((daysAgo) => ({
    date: addDays(today, -daysAgo),
    km: KM_TODAY - KM_PER_DAY * daysAgo,
  }));

  const vehicleId = await insertVehicle({
    ownerId,
    alias: ALIAS,
    make: 'Fiat',
    model: 'Palio',
    year: 2011,
    version: '1.4 Fire 8v',
    fuel: 'nafta',
    defaultKmPerDay: 40,
    odometer: odometerSummary(readings, 40, today),
    plan: [],
    planApprovedAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  for (const [i, reading] of readings.entries()) {
    await insertReading({
      ...reading,
      ownerId,
      vehicleId,
      odometerReset: false,
      source: i === 0 ? 'onboarding' : 'manual',
      createdAt: now,
    });
  }

  // Plan aprobado desde la plantilla, con un estado inicial que muestra todos los estados.
  const proposal = await templateProposer.propose({
    make: 'Fiat',
    model: 'Palio',
    year: 2011,
    version: '1.4 Fire 8v',
    fuel: 'nafta',
  });
  const plan: PlanItem[] = proposal.items.map((item) => {
    const known = INITIAL[item.itemId];
    return {
      ...item,
      active: item.included,
      origin: 'template',
      verifiedAt: item.critical ? now : undefined,
      approvedAt: now,
      initialDone:
        known === undefined
          ? null
          : (estimateLastDone(
              readings,
              {
                date: known.month ? new Date(`${known.month}-01T00:00:00Z`) : undefined,
                km: known.km,
              },
              KM_PER_DAY,
            ) ?? null),
    };
  });
  const vehicle = await getVehicle(ownerId, vehicleId);
  if (vehicle) await savePlan(ownerId, vehicle, plan, today, now, now);

  console.log(`db:seed: ${ALIAS} creado en ${db.databaseName} (${vehicleId}).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
