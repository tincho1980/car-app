import 'server-only';
import type { ClientSession } from 'mongodb';
import { client } from '@/server/db/client';

// Escrituras que van juntas o no van (ej. auto + lectura inicial).
export async function withTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = client.startSession();
  try {
    return await session.withTransaction(fn);
  } finally {
    await session.endSession();
  }
}
