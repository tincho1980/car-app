import { describe, expect, it } from 'vitest';
import { addDays, addMonths, daysBetween } from '@/core/dates';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

describe('fechas del dominio', () => {
  it('cuenta los días entre dos fechas', () => {
    expect(daysBetween(d('2026-10-01'), d('2026-10-24'))).toBe(23);
    expect(daysBetween(d('2026-10-24'), d('2026-10-01'))).toBe(-23);
  });

  it('suma días', () => {
    expect(addDays(d('2026-10-24'), 55)).toEqual(d('2026-12-18'));
  });

  it('suma meses', () => {
    expect(addMonths(d('2023-03-10'), 48)).toEqual(d('2027-03-10'));
  });

  it('al sumar meses recorta al fin de mes', () => {
    expect(addMonths(d('2026-01-31'), 1)).toEqual(d('2026-02-28'));
    expect(addMonths(d('2024-01-31'), 1)).toEqual(d('2024-02-29'));
  });
});
