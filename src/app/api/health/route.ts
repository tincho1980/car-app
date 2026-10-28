import { db } from '@/server/db/client';

// Público a propósito: lo usa el chequeo del deploy y no expone datos.
export async function GET() {
  try {
    await db.command({ ping: 1 });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
