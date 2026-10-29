// Formato y lectura de km y fechas (RNF-05). Las fechas de día calendario (lecturas, eventos)
// se guardan como Date a las 00:00 UTC, igual que en src/core: se muestran en UTC para no
// correrse de día.

export function formatKm(km: number): string {
  return Math.round(km)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseKm(value: string): number | undefined {
  const digits = value.replace(/[.\s]/g, '');
  return /^\d+$/.test(digits) ? Number(digits) : undefined;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// Valor de <input type="date">: aaaa-mm-dd.
export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDateInput(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// El día calendario en Argentina para un instante dado, como 00:00 UTC.
export function calendarDayInBuenosAires(instant: Date): Date {
  const day = instant.toLocaleDateString('en-CA', { timeZone: 'America/Buenos_Aires' });
  return new Date(`${day}T00:00:00Z`);
}

// Montos: se guardan en centavos (enteros, ARS) y se muestran "$ 85.000" (o "$ 85.000,50").
export function formatMoney(cents: number): string {
  const pesos = Math.trunc(cents / 100);
  const rest = Math.abs(cents % 100);
  return `$ ${formatKm(pesos)}${rest ? `,${String(rest).padStart(2, '0')}` : ''}`;
}

// "$ 85.000" o "85.000,50" → centavos. Vacío o inválido → undefined.
export function parseMoney(value: string): number | undefined {
  const clean = value.replace(/[$\s.]/g, '').replace(',', '.');
  if (clean === '' || !/^\d+(\.\d{1,2})?$/.test(clean)) return undefined;
  return Math.round(Number(clean) * 100);
}
