import { z } from 'zod';
import { PlanItemSchema } from '@/server/db/schemas/plan';

export const FUELS = ['nafta', 'diesel', 'gnc', 'nafta-gnc', 'hibrido', 'electrico'] as const;

export const FUEL_LABELS: Record<(typeof FUELS)[number], string> = {
  nafta: 'Nafta',
  diesel: 'Diésel',
  gnc: 'GNC',
  'nafta-gnc': 'Nafta + GNC',
  hibrido: 'Híbrido',
  electrico: 'Eléctrico',
};

const MAX_YEAR = new Date().getFullYear() + 1;

// Texto opcional: vacío = sin valor.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? undefined : v))
    .optional();

// Km del odómetro: entero, sin decimales.
export const KmSchema = z
  .number({ error: 'Completá los km' })
  .int('Los km van sin decimales')
  .min(0, 'Los km no pueden ser negativos')
  .max(2_000_000, 'Revisá los km');

// Lo que llega del formulario de alta (RF-03). Los obligatorios son el input de la IA (RF-05).
export const VehicleInputSchema = z.object({
  make: z.string().trim().min(1, 'Completá la marca').max(40),
  model: z.string().trim().min(1, 'Completá el modelo').max(40),
  year: z
    .number({ error: 'Completá el año' })
    .int()
    .min(1950, 'Revisá el año')
    .max(MAX_YEAR, 'Revisá el año'),
  version: z.string().trim().min(1, 'Completá la versión o el motor').max(60),
  fuel: z.enum(FUELS, { error: 'Elegí el combustible' }),
  km: KmSchema,
  alias: optionalText(40),
  plate: z
    .string()
    .trim()
    .max(10)
    .transform((v) => (v === '' ? undefined : v.toUpperCase()))
    .optional(),
  purchaseDate: z.date().optional(),
  defaultKmPerDay: z
    .number()
    .int('Los km/día van sin decimales')
    .min(0)
    .max(1_000, 'Revisá los km por día')
    .default(40),
});

// Editar: el km no se toca acá, cambia con las lecturas.
export const VehicleUpdateSchema = VehicleInputSchema.omit({ km: true });

// Caché del odómetro, recalculada con src/core en cada lectura (RN-03, RN-04).
export const OdometerSummarySchema = z.object({
  lastKm: KmSchema,
  lastDate: z.date(),
  kmPerDay: z.number().min(0),
  readingsCount: z.number().int().min(1),
});

export const VehicleSchema = VehicleUpdateSchema.extend({
  ownerId: z.email(),
  odometer: OdometerSummarySchema,
  // Plan aprobado (RN-14): embebido, son ~20 ítems que se leen siempre con el auto.
  plan: z.array(PlanItemSchema),
  planApprovedAt: z.date().nullable(),
  archivedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type VehicleInput = z.infer<typeof VehicleInputSchema>;
export type VehicleUpdate = z.infer<typeof VehicleUpdateSchema>;
export type OdometerSummary = z.infer<typeof OdometerSummarySchema>;
export type VehicleDoc = z.infer<typeof VehicleSchema>;
export type Fuel = (typeof FUELS)[number];
