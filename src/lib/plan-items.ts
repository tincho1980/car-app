import {
  ArrowUpDown,
  BatteryMedium,
  Circle,
  CircleDot,
  Cog,
  Disc,
  Disc3,
  Droplet,
  Fan,
  Fuel,
  RefreshCw,
  Thermometer,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { formatKm } from '@/lib/format';
import type { Category } from '@/server/db/schemas/plan';

// Ícono de cada ítem (los del frame 06) y, si no está, el de su categoría.
const ITEM_ICONS: Record<string, LucideIcon> = {
  'aceite-filtro': Droplet,
  'filtro-aire': Wind,
  'filtro-habitaculo': Fan,
  'filtro-combustible': Fuel,
  bujias: Zap,
  'correa-distribucion': Cog,
  'correa-accesorios': Cog,
  refrigerante: Thermometer,
  'liquido-frenos': CircleDot,
  pastillas: Disc3,
  discos: Disc,
  rotacion: RefreshCw,
  alineacion: CircleDot,
  cubiertas: Circle,
  'aceite-caja': Cog,
  bateria: BatteryMedium,
  amortiguadores: ArrowUpDown,
};

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  service: Wrench,
  encendido: Zap,
  motor: Cog,
  frenos: Disc,
  neumaticos: Circle,
  transmision: Cog,
  electrico: BatteryMedium,
  suspension: ArrowUpDown,
  otro: Wrench,
};

export function itemIcon(itemId: string, category: Category): LucideIcon {
  return ITEM_ICONS[itemId] ?? CATEGORY_ICONS[category];
}

// Pregunta del estado inicial (frame 07).
const QUESTIONS: Record<string, string> = {
  'aceite-filtro': 'se cambió el aceite y el filtro',
  'filtro-aire': 'se cambió el filtro de aire',
  'filtro-habitaculo': 'se cambió el filtro de habitáculo',
  'filtro-combustible': 'se cambió el filtro de combustible',
  bujias: 'se cambiaron las bujías',
  'correa-distribucion': 'se cambió la correa de distribución',
  'correa-accesorios': 'se cambió la correa de accesorios',
  refrigerante: 'se cambió el líquido refrigerante',
  'liquido-frenos': 'se cambió el líquido de frenos',
  pastillas: 'se revisaron las pastillas de freno',
  discos: 'se revisaron los discos de freno',
  rotacion: 'se rotaron las cubiertas',
  alineacion: 'se hizo la alineación y el balanceo',
  cubiertas: 'se cambiaron las cubiertas',
  'aceite-caja': 'se cambió el aceite de caja',
  bateria: 'se revisó la batería',
  amortiguadores: 'se revisaron los amortiguadores',
};

export function lastDoneQuestion(itemId: string, name: string): string {
  const action = QUESTIONS[itemId];
  return action
    ? `¿Cuándo ${action} por última vez?`
    : `¿Cuándo se hizo por última vez: ${name.toLowerCase()}?`;
}

// "60.000 km · 48 meses", con "—" en el que falte (frame 06).
export function formatInterval(item: { intervalKm?: number; intervalMonths?: number }): string {
  const km = item.intervalKm !== undefined ? `${formatKm(item.intervalKm)} km` : '—';
  const months =
    item.intervalMonths !== undefined
      ? `${item.intervalMonths} ${item.intervalMonths === 1 ? 'mes' : 'meses'}`
      : '—';
  return `${km} · ${months}`;
}
