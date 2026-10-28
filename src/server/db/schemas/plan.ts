import { z } from 'zod';

export const CATEGORIES = [
  'service',
  'encendido',
  'motor',
  'frenos',
  'neumaticos',
  'transmision',
  'electrico',
  'suspension',
  'otro',
] as const;

export const CATEGORY_LABELS: Record<Category, string> = {
  service: 'Service',
  encendido: 'Encendido',
  motor: 'Motor',
  frenos: 'Frenos',
  neumaticos: 'Neumáticos',
  transmision: 'Transmisión',
  electrico: 'Eléctrico',
  suspension: 'Suspensión',
  otro: 'Otro',
};

export const ORIGINS = ['ai', 'template', 'manual'] as const;
export const ITEM_STATES = ['ok', 'soon', 'overdue', 'unknown'] as const;

const LastDoneSchema = z.object({
  date: z.date(),
  km: z.number().int().min(0),
  eventId: z.string().optional(),
  estimated: z.boolean().optional(),
});

// Lo editable de un ítem (RF-06): nombre, categoría, intervalos y umbrales de aviso.
export const PlanItemFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Completá el nombre').max(60),
  category: z.enum(CATEGORIES, { error: 'Elegí la categoría' }),
  intervalKm: z
    .number()
    .int('Los km van sin decimales')
    .min(100, 'Revisá los km')
    .max(500_000, 'Revisá los km')
    .optional(),
  intervalMonths: z
    .number()
    .int('Los meses van sin decimales')
    .min(1, 'Revisá los meses')
    .max(240, 'Revisá los meses')
    .optional(),
  warnKm: z.number().int().min(0).max(50_000).default(1_000),
  warnDays: z.number().int().min(0).max(365).default(30),
});

// RF-06: al menos uno de los dos intervalos.
function requireInterval(
  item: { intervalKm?: number; intervalMonths?: number },
  ctx: z.RefinementCtx,
) {
  if (item.intervalKm === undefined && item.intervalMonths === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['intervalKm'],
      message: 'Poné un intervalo en km, en meses o en los dos',
    });
  }
}

export const PlanItemInputSchema = PlanItemFieldsSchema.superRefine(requireInterval);

// Caché del estado (RN-09): se recalcula en cada cambio y en el cron.
const ItemStatusCacheSchema = z.object({
  state: z.enum(ITEM_STATES),
  dueKm: z.number().int().optional(),
  dueDate: z.date().optional(),
  estDueDate: z.date().optional(),
  estimated: z.boolean(),
  lastDone: LastDoneSchema.optional(),
  notifiedState: z.enum(ITEM_STATES).optional(),
  notifiedAt: z.date().optional(),
});

export const PlanItemSchema = PlanItemFieldsSchema.extend({
  itemId: z.string().min(1),
  critical: z.boolean().default(false),
  note: z.string().optional(),
  // false = "no aplica" (RN-10).
  active: z.boolean(),
  origin: z.enum(ORIGINS),
  // Editado a mano (RN-12): una propuesta nueva no lo pisa sin confirmación.
  edited: z.boolean().default(false),
  verifiedAt: z.date().optional(),
  approvedAt: z.date(),
  snooze: z.object({ untilDate: z.date().optional(), untilKm: z.number().optional() }).optional(),
  // Estado inicial (RF-08). null = "No sé"; ausente = todavía no se preguntó.
  initialDone: LastDoneSchema.nullable().optional(),
  status: ItemStatusCacheSchema.optional(),
}).superRefine(requireInterval);

// Ítem de una propuesta (RF-05): se incluye o descarta, y los críticos se verifican.
export const ProposalItemSchema = PlanItemFieldsSchema.extend({
  itemId: z.string().min(1),
  critical: z.boolean().default(false),
  note: z.string().optional(),
  included: z.boolean(),
  verified: z.boolean().default(false),
  edited: z.boolean().default(false),
}).superRefine(requireInterval);

export type Category = (typeof CATEGORIES)[number];
export type PlanItemInput = z.infer<typeof PlanItemInputSchema>;
export type PlanItem = z.infer<typeof PlanItemSchema>;
export type ProposalItem = z.infer<typeof ProposalItemSchema>;
export type ItemStatusCache = z.infer<typeof ItemStatusCacheSchema>;
