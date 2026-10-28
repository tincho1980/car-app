import { describe, expect, it } from 'vitest';
import { consumedFraction, estimateLastDone } from '@/core/last-done';
import type { PlanItemRule } from '@/core/types';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

const readings = [
  { date: d('2026-07-03'), km: 115_500 },
  { date: d('2026-10-01'), km: 120_000 },
];

describe('estimateLastDone (dato parcial del estado inicial)', () => {
  it('con fecha y km no estima nada', () => {
    expect(estimateLastDone(readings, { date: d('2023-03-01'), km: 82_000 }, 50)).toEqual({
      date: d('2023-03-01'),
      km: 82_000,
      estimated: false,
    });
  });

  it('sin fecha ni km no hay último realizado', () => {
    expect(estimateLastDone(readings, {}, 50)).toBeUndefined();
  });

  it('solo km, entre dos lecturas: interpola la fecha', () => {
    // 117.750 km está a mitad de camino entre 03/07 y 01/10 (90 días).
    expect(estimateLastDone(readings, { km: 117_750 }, 50)).toEqual({
      date: d('2026-08-17'),
      km: 117_750,
      estimated: true,
    });
  });

  it('solo km, antes de la primera lectura: va hacia atrás con el km/día', () => {
    // 15.500 km antes de 115.500 a 50 km/día = 310 días antes del 03/07/2026.
    expect(estimateLastDone(readings, { km: 100_000 }, 50)).toEqual({
      date: d('2025-08-27'),
      km: 100_000,
      estimated: true,
    });
  });

  it('solo fecha, entre dos lecturas: interpola el km', () => {
    expect(estimateLastDone(readings, { date: d('2026-08-17') }, 50)).toEqual({
      date: d('2026-08-17'),
      km: 117_750,
      estimated: true,
    });
  });

  it('solo fecha, antes de la primera lectura: resta km/día × días', () => {
    expect(estimateLastDone(readings, { date: d('2025-08-27') }, 50)).toEqual({
      date: d('2025-08-27'),
      km: 100_000,
      estimated: true,
    });
  });

  it('nunca estima km negativos', () => {
    expect(estimateLastDone(readings, { date: d('2000-01-01') }, 50)?.km).toBe(0);
  });

  it('con el auto parado y solo km, toma la fecha de la primera lectura', () => {
    expect(estimateLastDone(readings, { km: 100_000 }, 0)?.date).toEqual(d('2026-07-03'));
  });
});

describe('consumedFraction (barra del ítem)', () => {
  const today = d('2026-10-24');
  const aceite: PlanItemRule = {
    itemId: 'aceite',
    intervalKm: 10_000,
    intervalMonths: 12,
    warnKm: 1_000,
    warnDays: 30,
    active: true,
  };
  const lastDone = { date: d('2026-04-24'), km: 112_000 };

  it('toma lo que más se consumió entre km y tiempo', () => {
    // km: 3.000 de 10.000 (30 %); tiempo: 183 de 365 días (~50 %).
    expect(consumedFraction(aceite, { lastDone, kmLeft: 7_000 }, today)).toBeCloseTo(0.5, 1);
  });

  it('vencido llena la barra', () => {
    expect(consumedFraction(aceite, { lastDone, kmLeft: -500 }, today)).toBe(1);
  });

  it('sin último realizado la barra está vacía', () => {
    expect(consumedFraction(aceite, {}, today)).toBe(0);
  });
});
