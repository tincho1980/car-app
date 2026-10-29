// Crea los índices de Mongo (docs/03-arquitectura.md §4). Cada colección nueva suma los suyos.
import { client, db } from '@/server/db/client';

async function main() {
  await db.collection('vehicles').createIndex({ ownerId: 1, archivedAt: 1 });
  await db.collection('odometerReadings').createIndex({ vehicleId: 1, date: -1 });
  await db.collection('planProposals').createIndex({ vehicleId: 1, status: 1 });
  await db.collection('events').createIndex({ vehicleId: 1, date: -1 });
  await db.collection('events').createIndex({ vehicleId: 1, itemIds: 1 });
  console.log(`db:indexes: índices creados en ${db.databaseName}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => client.close());
