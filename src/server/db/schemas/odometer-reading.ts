import { z } from 'zod';
import { KmSchema } from '@/server/db/schemas/vehicle';

export const READING_SOURCES = ['onboarding', 'event', 'manual'] as const;

// Lo que llega de la hoja "Cargar km" (RF-15).
export const ReadingInputSchema = z.object({
  km: KmSchema,
  date: z.date({ error: 'Elegí la fecha' }),
  // "Cambié el tablero u odómetro" (RN-07).
  odometerReset: z.boolean().default(false),
});

export const OdometerReadingSchema = ReadingInputSchema.extend({
  ownerId: z.email(),
  vehicleId: z.string().min(1),
  source: z.enum(READING_SOURCES),
  eventId: z.string().optional(),
  createdAt: z.date(),
});

export type ReadingInput = z.infer<typeof ReadingInputSchema>;
export type OdometerReadingDoc = z.infer<typeof OdometerReadingSchema>;
