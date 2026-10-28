import 'server-only';
import { ObjectId, type ClientSession, type WithId } from 'mongodb';
import { db } from '@/server/db/client';
import {
  OdometerSummarySchema,
  VehicleSchema,
  VehicleUpdateSchema,
  type OdometerSummary,
  type VehicleDoc,
  type VehicleUpdate,
} from '@/server/db/schemas/vehicle';

const vehicles = db.collection<VehicleDoc>('vehicles');

export type Vehicle = VehicleDoc & { id: string };

function toVehicle({ _id, ...doc }: WithId<VehicleDoc>): Vehicle {
  return { ...doc, id: _id.toString() };
}

// Un id inválido en la URL se trata como "no existe".
function byId(ownerId: string, id: string) {
  return ObjectId.isValid(id) ? { _id: new ObjectId(id), ownerId } : null;
}

export async function listVehicles(ownerId: string): Promise<Vehicle[]> {
  const docs = await vehicles.find({ ownerId }).sort({ archivedAt: 1, createdAt: 1 }).toArray();
  return docs.map(toVehicle);
}

export async function getVehicle(ownerId: string, id: string): Promise<Vehicle | null> {
  const filter = byId(ownerId, id);
  if (!filter) return null;
  const doc = await vehicles.findOne(filter);
  return doc && toVehicle(doc);
}

export async function insertVehicle(doc: VehicleDoc, session?: ClientSession): Promise<string> {
  const { insertedId } = await vehicles.insertOne(VehicleSchema.parse(doc), { session });
  return insertedId.toString();
}

export async function updateVehicle(
  ownerId: string,
  id: string,
  data: VehicleUpdate,
  now: Date,
): Promise<boolean> {
  const filter = byId(ownerId, id);
  if (!filter) return false;
  const parsed = VehicleUpdateSchema.parse(data);
  // Los opcionales que quedaron vacíos se borran del documento ($unset no puede ir vacío).
  const cleared = (['alias', 'plate', 'purchaseDate'] as const).filter((k) => !parsed[k]);
  const { matchedCount } = await vehicles.updateOne(filter, {
    $set: { ...parsed, updatedAt: now },
    ...(cleared.length > 0 && { $unset: Object.fromEntries(cleared.map((k) => [k, ''])) }),
  });
  return matchedCount === 1;
}

export async function setArchived(
  ownerId: string,
  id: string,
  archivedAt: Date | null,
  now: Date,
): Promise<boolean> {
  const filter = byId(ownerId, id);
  if (!filter) return false;
  const { matchedCount } = await vehicles.updateOne(filter, {
    $set: { archivedAt, updatedAt: now },
  });
  return matchedCount === 1;
}

export async function setOdometer(
  ownerId: string,
  id: string,
  odometer: OdometerSummary,
  now: Date,
  session?: ClientSession,
): Promise<void> {
  const filter = byId(ownerId, id);
  if (!filter) return;
  await vehicles.updateOne(
    filter,
    { $set: { odometer: OdometerSummarySchema.parse(odometer), updatedAt: now } },
    { session },
  );
}
