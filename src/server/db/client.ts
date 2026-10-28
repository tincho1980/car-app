import 'server-only';
import { MongoClient } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';
import { env } from '@/env';

// Único MongoClient de la app (docs/03-arquitectura.md §2.1).
const g = globalThis as unknown as { _mongo?: MongoClient };

export const client = g._mongo ?? new MongoClient(env.MONGODB_URI, { maxPoolSize: 5 });
if (process.env.NODE_ENV !== 'production') g._mongo = client;
attachDatabasePool(client);

export const db = client.db(env.MONGODB_DB);
