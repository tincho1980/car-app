import { describe, expect, it } from 'vitest';
import {
  calendarDayInBuenosAires,
  formatDate,
  formatKm,
  parseDateInput,
  parseKm,
  toDateInput,
} from '@/lib/format';

describe('km', () => {
  it('se muestra con punto de miles', () => {
    expect(formatKm(120000)).toBe('120.000');
    expect(formatKm(1000)).toBe('1.000');
    expect(formatKm(999)).toBe('999');
    expect(formatKm(1234567)).toBe('1.234.567');
  });

  it('se lee ignorando puntos y espacios', () => {
    expect(parseKm('120.000')).toBe(120000);
    expect(parseKm(' 1.234 ')).toBe(1234);
    expect(parseKm('')).toBeUndefined();
    expect(parseKm('12a')).toBeUndefined();
  });
});

describe('fechas de día calendario (00:00 UTC)', () => {
  it('se muestran como dd/mm/aaaa sin correrse de día', () => {
    expect(formatDate(new Date('2026-10-01T00:00:00Z'))).toBe('01/10/2026');
  });

  it('van y vuelven del input de fecha', () => {
    const date = parseDateInput('2026-10-27');
    expect(date).toEqual(new Date('2026-10-27T00:00:00Z'));
    expect(toDateInput(date!)).toBe('2026-10-27');
    expect(parseDateInput('27/10/2026')).toBeUndefined();
  });

  it('"hoy" es el día calendario de Buenos Aires', () => {
    // 28/10 a las 01:30 UTC todavía es 27/10 a las 22:30 en Buenos Aires.
    expect(calendarDayInBuenosAires(new Date('2026-10-28T01:30:00Z'))).toEqual(
      new Date('2026-10-27T00:00:00Z'),
    );
    expect(calendarDayInBuenosAires(new Date('2026-10-28T03:30:00Z'))).toEqual(
      new Date('2026-10-28T00:00:00Z'),
    );
  });
});
