import { describe, expect, it } from 'vitest';
import { ReadingInputSchema } from '@/server/db/schemas/odometer-reading';
import { VehicleInputSchema } from '@/server/db/schemas/vehicle';

const palio = {
  make: 'Fiat',
  model: 'Palio',
  year: 2011,
  version: '1.4 Fire 8v',
  fuel: 'nafta',
  km: 120_000,
};

describe('VehicleInputSchema', () => {
  it('acepta el Palio con lo obligatorio y completa el km/día default', () => {
    const parsed = VehicleInputSchema.parse(palio);
    expect(parsed.defaultKmPerDay).toBe(40);
    expect(parsed.alias).toBeUndefined();
  });

  it('limpia los opcionales vacíos y pasa la patente a mayúsculas', () => {
    const parsed = VehicleInputSchema.parse({ ...palio, alias: '  ', plate: 'ab123cd' });
    expect(parsed.alias).toBeUndefined();
    expect(parsed.plate).toBe('AB123CD');
  });

  it('rechaza km negativos o con decimales', () => {
    expect(VehicleInputSchema.safeParse({ ...palio, km: -1 }).success).toBe(false);
    expect(VehicleInputSchema.safeParse({ ...palio, km: 120_000.5 }).success).toBe(false);
  });

  it('rechaza un año fuera de rango', () => {
    expect(VehicleInputSchema.safeParse({ ...palio, year: 1900 }).success).toBe(false);
    expect(VehicleInputSchema.safeParse({ ...palio, year: 3000 }).success).toBe(false);
  });

  it('rechaza un combustible que no existe', () => {
    expect(VehicleInputSchema.safeParse({ ...palio, fuel: 'leña' }).success).toBe(false);
  });

  it('exige marca, modelo y versión', () => {
    const result = VehicleInputSchema.safeParse({ ...palio, make: ' ', version: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path[0])).toEqual(['make', 'version']);
  });
});

describe('ReadingInputSchema', () => {
  it('acepta km y fecha, sin cambio de tablero por defecto', () => {
    const parsed = ReadingInputSchema.parse({ km: 121_000, date: new Date('2026-10-27') });
    expect(parsed.odometerReset).toBe(false);
  });

  it('exige la fecha', () => {
    expect(ReadingInputSchema.safeParse({ km: 121_000 }).success).toBe(false);
  });
});
