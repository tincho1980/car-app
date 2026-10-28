import { describe, expect, it } from 'vitest';
import { validateReading } from '@/core/reading-validation';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

const readings = [
  { date: d('2026-07-03'), km: 115_500 },
  { date: d('2026-10-01'), km: 120_000 },
];

describe('validateReading (RN-07)', () => {
  it('acepta una lectura mayor a la última', () => {
    expect(validateReading(readings, { date: d('2026-10-27'), km: 121_000 })).toEqual({
      ok: true,
    });
  });

  it('acepta el mismo km que la última lectura', () => {
    expect(validateReading(readings, { date: d('2026-10-27'), km: 120_000 }).ok).toBe(true);
  });

  it('frena un km menor a la última lectura', () => {
    expect(validateReading(readings, { date: d('2026-10-27'), km: 112_400 })).toEqual({
      ok: false,
      reason: 'below-previous',
      reading: readings[1],
    });
  });

  it('con "cambié el tablero" acepta un km menor', () => {
    expect(
      validateReading(readings, { date: d('2026-10-27'), km: 50, odometerReset: true }).ok,
    ).toBe(true);
  });

  it('una lectura con fecha anterior tiene que quedar entre sus vecinas', () => {
    expect(validateReading(readings, { date: d('2026-08-15'), km: 118_000 }).ok).toBe(true);
    expect(validateReading(readings, { date: d('2026-08-15'), km: 121_000 })).toEqual({
      ok: false,
      reason: 'above-next',
      reading: readings[1],
    });
    expect(validateReading(readings, { date: d('2026-08-15'), km: 115_000 })).toMatchObject({
      ok: false,
      reason: 'below-previous',
      reading: readings[0],
    });
  });

  it('el mismo día cuenta como lectura anterior', () => {
    expect(validateReading(readings, { date: d('2026-10-01'), km: 119_000 })).toMatchObject({
      ok: false,
      reason: 'below-previous',
    });
  });

  it('después de un cambio de tablero compara con el tablero nuevo', () => {
    const conCambio = [...readings, { date: d('2026-10-10'), km: 0, odometerReset: true }];
    expect(validateReading(conCambio, { date: d('2026-10-27'), km: 1_200 }).ok).toBe(true);
  });

  it('una lectura posterior que es cambio de tablero no limita a las anteriores', () => {
    const conCambio = [...readings, { date: d('2026-10-10'), km: 0, odometerReset: true }];
    expect(validateReading(conCambio, { date: d('2026-10-05'), km: 120_300 }).ok).toBe(true);
  });

  it('el primer km de un auto siempre vale', () => {
    expect(validateReading([], { date: d('2026-10-27'), km: 120_000 }).ok).toBe(true);
  });
});
