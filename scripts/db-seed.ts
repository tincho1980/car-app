// Carga el Palio de ejemplo con lecturas de los últimos meses (~50 km/día).
// Solo corre sobre una base -dev: nunca toca los datos reales.
import { addDays } from '@/core/dates';
import { odometerSummary } from '@/core/odometer';
import { env } from '@/env';
import { calendarDayInBuenosAires } from '@/lib/format';
import { client, db } from '@/server/db/client';
import { insertReading } from '@/server/db/repos/odometer-readings';
import { insertVehicle } from '@/server/db/repos/vehicles';

const ALIAS = 'El Palio';
const KM_PER_DAY = 50;
const DAYS_AGO = [180, 120, 60, 10];
const KM_TODAY = 120_000;

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

  console.log(`db:seed: ${ALIAS} creado en ${db.databaseName} (${vehicleId}).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
