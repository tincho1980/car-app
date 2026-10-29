import 'server-only';
import { ObjectId, type ClientSession, type Filter, type WithId } from 'mongodb';
import { db } from '@/server/db/client';
import {
  EventInputSchema,
  EventSchema,
  type EventDoc,
  type EventInput,
  type EventType,
} from '@/server/db/schemas/event';

const events = db.collection<EventDoc>('events');

export type MaintenanceEventRecord = EventDoc & { id: string };

function toEvent({ _id, ...doc }: WithId<EventDoc>): MaintenanceEventRecord {
  return { ...doc, id: _id.toString() };
}

function byId(ownerId: string, id: string) {
  return ObjectId.isValid(id) ? { _id: new ObjectId(id), ownerId } : null;
}

export type EventFilters = { type?: EventType; itemId?: string; from?: Date; to?: Date };

// Más reciente primero (RF-27).
export async function listEvents(
  ownerId: string,
  vehicleId: string,
  filters: EventFilters = {},
): Promise<MaintenanceEventRecord[]> {
  const filter: Filter<EventDoc> = { ownerId, vehicleId };
  if (filters.type) filter.type = filters.type;
  if (filters.itemId) filter.itemIds = filters.itemId;
  if (filters.from || filters.to) {
    filter.date = {
      ...(filters.from && { $gte: filters.from }),
      ...(filters.to && { $lte: filters.to }),
    };
  }
  const docs = await events.find(filter).sort({ date: -1, km: -1 }).toArray();
  return docs.map(toEvent);
}

export async function getEvent(
  ownerId: string,
  id: string,
): Promise<MaintenanceEventRecord | null> {
  const filter = byId(ownerId, id);
  if (!filter) return null;
  const doc = await events.findOne(filter);
  return doc && toEvent(doc);
}

export async function insertEvent(doc: EventDoc, session?: ClientSession): Promise<string> {
  const { insertedId } = await events.insertOne(EventSchema.parse(doc), { session });
  return insertedId.toString();
}

export async function updateEvent(
  ownerId: string,
  id: string,
  data: EventInput,
  now: Date,
  session?: ClientSession,
): Promise<boolean> {
  const filter = byId(ownerId, id);
  if (!filter) return false;
  const parsed = EventInputSchema.parse(data);
  // Los opcionales que quedaron vacíos se borran del documento.
  const cleared = (['totalCost', 'shop', 'notes'] as const).filter((k) => parsed[k] === undefined);
  const { matchedCount } = await events.updateOne(
    filter,
    {
      $set: { ...parsed, updatedAt: now },
      ...(cleared.length > 0 && { $unset: Object.fromEntries(cleared.map((k) => [k, ''])) }),
    },
    { session },
  );
  return matchedCount === 1;
}

export async function deleteEvent(
  ownerId: string,
  id: string,
  session?: ClientSession,
): Promise<boolean> {
  const filter = byId(ownerId, id);
  if (!filter) return false;
  const { deletedCount } = await events.deleteOne(filter, { session });
  return deletedCount === 1;
}
