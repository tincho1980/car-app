import type { Fuel } from '@/server/db/schemas/vehicle';
import type { Category } from '@/server/db/schemas/plan';

// Plantilla genérica de respaldo (02-requerimientos, Anexo A). Valores orientativos:
// no reemplazan el manual. La usa el proponedor sin IA (RF-05) y es la lista mínima de la IA.
export type TemplateItem = {
  itemId: string;
  name: string;
  category: Category;
  intervalKm?: number;
  intervalMonths?: number;
  note?: string;
  // Los críticos piden "Verificado con manual o taller" antes de aprobar.
  critical?: boolean;
  // Arranca descartado en la revisión (se puede incluir).
  excludedByDefault?: boolean;
};

export const TEMPLATE_PLAN: TemplateItem[] = [
  {
    itemId: 'aceite-filtro',
    name: 'Aceite y filtro de aceite',
    category: 'service',
    intervalKm: 10_000,
    intervalMonths: 12,
    note: 'Sintético puede ir a 15.000',
  },
  {
    itemId: 'filtro-aire',
    name: 'Filtro de aire',
    category: 'service',
    intervalKm: 20_000,
    intervalMonths: 24,
  },
  {
    itemId: 'filtro-habitaculo',
    name: 'Filtro de habitáculo',
    category: 'service',
    intervalKm: 15_000,
    intervalMonths: 12,
  },
  {
    itemId: 'filtro-combustible',
    name: 'Filtro de combustible',
    category: 'service',
    intervalKm: 40_000,
    intervalMonths: 48,
    note: 'Diésel: bastante menos',
  },
  {
    itemId: 'bujias',
    name: 'Bujías',
    category: 'encendido',
    intervalKm: 30_000,
    intervalMonths: 36,
    note: 'Solo nafta; iridio ~60.000',
  },
  {
    itemId: 'correa-distribucion',
    name: 'Correa de distribución (+ tensor/bomba)',
    category: 'motor',
    intervalKm: 60_000,
    intervalMonths: 48,
    critical: true,
    note: 'Muy variable; "no aplica" si es cadena',
  },
  {
    itemId: 'correa-accesorios',
    name: 'Correa de accesorios',
    category: 'motor',
    intervalKm: 60_000,
    intervalMonths: 48,
  },
  {
    itemId: 'refrigerante',
    name: 'Líquido refrigerante',
    category: 'motor',
    intervalKm: 40_000,
    intervalMonths: 24,
  },
  {
    itemId: 'liquido-frenos',
    name: 'Líquido de frenos',
    category: 'frenos',
    intervalMonths: 24,
    critical: true,
    note: 'Solo por tiempo',
  },
  {
    itemId: 'pastillas',
    name: 'Pastillas de freno (revisión)',
    category: 'frenos',
    intervalKm: 20_000,
    note: 'Revisión; cambio según desgaste',
  },
  { itemId: 'discos', name: 'Discos de freno (revisión)', category: 'frenos', intervalKm: 60_000 },
  { itemId: 'rotacion', name: 'Rotación de cubiertas', category: 'neumaticos', intervalKm: 10_000 },
  {
    itemId: 'alineacion',
    name: 'Alineación y balanceo',
    category: 'neumaticos',
    intervalKm: 10_000,
    intervalMonths: 12,
  },
  {
    itemId: 'cubiertas',
    name: 'Cubiertas (reemplazo)',
    category: 'neumaticos',
    intervalKm: 50_000,
    intervalMonths: 60,
    note: 'Revisar dibujo y antigüedad',
  },
  {
    itemId: 'aceite-caja',
    name: 'Aceite de caja',
    category: 'transmision',
    intervalKm: 60_000,
    note: 'Muchas cajas "de por vida": revisar manual',
    excludedByDefault: true,
  },
  { itemId: 'bateria', name: 'Batería (revisión)', category: 'electrico', intervalMonths: 36 },
  {
    itemId: 'amortiguadores',
    name: 'Amortiguadores (revisión)',
    category: 'suspension',
    intervalKm: 60_000,
  },
];

// Ítems que no aplican según el combustible: arrancan descartados.
const NOT_FOR_FUEL: Partial<Record<Fuel, string[]>> = {
  diesel: ['bujias'],
  electrico: [
    'aceite-filtro',
    'filtro-combustible',
    'bujias',
    'correa-distribucion',
    'correa-accesorios',
  ],
};

export type TemplateProposalItem = TemplateItem & { included: boolean };

export function templateProposal(fuel: Fuel): TemplateProposalItem[] {
  const excluded = NOT_FOR_FUEL[fuel] ?? [];
  return TEMPLATE_PLAN.map((item) => ({
    ...item,
    included: !item.excludedByDefault && !excluded.includes(item.itemId),
  }));
}
