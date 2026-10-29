import 'server-only';
import type { ClientSession, WithId } from 'mongodb';
import { db } from '@/server/db/client';
import {
  OdometerReadingSchema,
  type OdometerReadingDoc,
} from '@/server/db/schemas/odometer-reading';

const readings = db.collection<OdometerReadingDoc>('odometerReadings');

export type OdometerReading = OdometerReadingDoc & { id: string };

function toReading({ _id, ...doc }: WithId<OdometerReadingDoc>): OdometerReading {
  return { ...doc, id: _id.toString() };
}

// Más reciente primero.
export async function listReadings(ownerId: string, vehicleId: string): Promise<OdometerReading[]> {
  const docs = await readings.find({ ownerId, vehicleId }).sort({ date: -1, km: -1 }).toArray();
  return docs.map(toReading);
}

export async function insertReading(
  doc: OdometerReadingDoc,
  session?: ClientSession,
): Promise<string> {
  const { insertedId } = await readings.insertOne(OdometerReadingSchema.parse(doc), { session });
  return insertedId.toString();
}

// La lectura que generó un evento (source: event) sigue al evento: se edita y se borra con él.
export async function updateReadingOfEvent(
  ownerId: string,
  eventId: string,
  data: { date: Date; km: number },
  session?: ClientSession,
): Promise<void> {
  await readings.updateOne({ ownerId, eventId }, { $set: data }, { session });
}

export async function deleteReadingOfEvent(
  ownerId: string,
  eventId: string,
  session?: ClientSession,
): Promise<void> {
  await readings.deleteOne({ ownerId, eventId }, { session });
}
