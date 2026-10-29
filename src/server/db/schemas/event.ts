import { z } from 'zod';
import { KmSchema } from '@/server/db/schemas/vehicle';

export const EVENT_TYPES = [
  'service',
  'preventivo',
  'reparacion',
  'neumaticos',
  'frenos',
  'otro',
] as const;

// "Cubiertas" como en el frame 08.
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  service: 'Service',
  preventivo: 'Preventivo',
  reparacion: 'Reparación',
  neumaticos: 'Cubiertas',
  frenos: 'Frenos',
  otro: 'Otro',
};

// Montos en centavos, enteros, en ARS.
const CentsSchema = z
  .number()
  .int('El monto va en centavos enteros')
  .min(0, 'El monto no puede ser negativo')
  .max(100_000_000_00, 'Revisá el monto');

export const PartSchema = z.object({
  desc: z.string().trim().min(1, 'Completá la descripción del repuesto').max(80),
  brand: z.string().trim().max(40).optional(),
  partNumber: z.string().trim().max(40).optional(),
  qty: z.number().int().min(1, 'La cantidad mínima es 1').max(999).default(1),
  unitPrice: CentsSchema.optional(),
});

// Lo que llega del formulario (RF-09). Un evento sin ítems del plan es válido.
export const EventInputSchema = z.object({
  type: z.enum(EVENT_TYPES, { error: 'Elegí el tipo' }),
  itemIds: z.array(z.string().min(1)).default([]),
  date: z.date({ error: 'Elegí la fecha' }),
  km: KmSchema,
  totalCost: CentsSchema.optional(),
  shop: z.string().trim().max(60).optional(),
  parts: z.array(PartSchema).default([]),
  notes: z.string().trim().max(1_000).optional(),
});

export const EventSchema = EventInputSchema.extend({
  ownerId: z.email(),
  vehicleId: z.string().min(1),
  currency: z.literal('ARS'),
  // Comprobantes en R2 desde F08 (solo la key en Mongo).
  attachments: z
    .array(z.object({ key: z.string(), mime: z.string(), size: z.number().int() }))
    .default([]),
  source: z.enum(['manual', 'ai']),
  aiRunId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EventType = (typeof EVENT_TYPES)[number];
export type EventInput = z.infer<typeof EventInputSchema>;
export type EventDoc = z.infer<typeof EventSchema>;
export type Part = z.infer<typeof PartSchema>;
