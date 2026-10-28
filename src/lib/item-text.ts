import { daysBetween } from '@/core/dates';
import type { ItemStatus } from '@/core/types';
import { formatKm } from '@/lib/format';

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

// "~14 días", "~16/11" o "~marzo 2027", según qué tan lejos esté.
export function approxDate(date: Date, today: Date): string {
  const days = daysBetween(today, date);
  if (days <= 30) return `~${days} ${days === 1 ? 'día' : 'días'}`;
  if (days <= 90) {
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `~${dd}/${mm}`;
  }
  return `~${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

// "2 meses", "3 días", "1 año".
export function elapsed(days: number): string {
  if (days < 31) return `${days} ${days === 1 ? 'día' : 'días'}`;
  if (days < 365) {
    const months = Math.round(days / 30.4);
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  const years = Math.round(days / 365);
  return `${years} ${years === 1 ? 'año' : 'años'}`;
}

// Línea de detalle de una fila de vencimiento (frame 02).
export function dueText(status: ItemStatus, today: Date): string {
  if (status.state === 'unknown') {
    return 'No sabemos cuándo se hizo. Cargá el último dato.';
  }

  if (status.state === 'overdue') {
    if (status.dueDate && status.dueDate <= today) {
      return `Vencido hace ${elapsed(daysBetween(status.dueDate, today))}`;
    }
    return `Vencido hace ≈ ${formatKm(-(status.kmLeft ?? 0))} km`;
  }

  const parts: string[] = [];
  if (status.kmLeft !== undefined) parts.push(`Faltan ≈ ${formatKm(status.kmLeft)} km`);
  if (status.estDueDate) {
    const when = approxDate(status.estDueDate, today);
    parts.push(parts.length > 0 ? when : `Vence ${when}`);
  }
  return parts.join(' · ');
}
