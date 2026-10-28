// Fechas del dominio: días calendario representados como Date a las 00:00 UTC.
const MS_PER_DAY = 86_400_000;

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

// Recorta al último día del mes: 31/01 + 1 mes = 28/02 (o 29/02).
export function addMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
}

export function minDate(a: Date | undefined, b: Date | undefined): Date | undefined {
  if (!a) return b;
  if (!b) return a;
  return a <= b ? a : b;
}
