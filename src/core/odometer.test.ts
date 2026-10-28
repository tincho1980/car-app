import { describe, expect, it } from 'vitest';
import { estimatedKm, kmPerDay, toVirtualKm, virtualOdometer } from '@/core/odometer';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const today = d('2026-10-24');

describe('kmPerDay (RN-03)', () => {
  it('con menos de 2 lecturas usa el default', () => {
    expect(kmPerDay([], today, 40)).toBe(40);
    expect(kmPerDay([{ date: d('2026-10-01'), km: 120_000 }], today, 40)).toBe(40);
  });

  it('con 2 lecturas usa el promedio entre ambas', () => {
    const readings = [
      { date: d('2026-08-01'), km: 117_000 },
      { date: d('2026-10-01'), km: 120_050 },
    ];
    expect(kmPerDay(readings, today, 40)).toBe(50);
  });

  it('compara la última lectura con la de hace ~90 días, no con la más vieja', () => {
    const readings = [
      { date: d('2025-01-01'), km: 100_000 },
      { date: d('2026-07-03'), km: 115_500 },
      { date: d('2026-09-01'), km: 117_000 },
      { date: d('2026-10-01'), km: 120_000 },
    ];
    // 01/10 contra 03/07 (90 días): 4.500 km / 90 días.
    expect(kmPerDay(readings, today, 40)).toBe(50);
  });

  it('auto parado: km/día = 0', () => {
    const readings = [
      { date: d('2026-07-01'), km: 120_000 },
      { date: d('2026-10-01'), km: 120_000 },
    ];
    expect(kmPerDay(readings, today, 40)).toBe(0);
  });

  it('dos lecturas el mismo día no alcanzan para promediar', () => {
    const readings = [
      { date: d('2026-10-01'), km: 119_900 },
      { date: d('2026-10-01'), km: 120_000 },
    ];
    expect(kmPerDay(readings, today, 40)).toBe(40);
  });

  it('ignora lecturas posteriores a hoy', () => {
    const readings = [
      { date: d('2026-08-02'), km: 117_000 },
      { date: d('2026-10-01'), km: 120_000 },
      { date: d('2026-11-01'), km: 200_000 },
    ];
    expect(kmPerDay(readings, today, 40)).toBe(50);
  });
});

describe('estimatedKm (RN-04)', () => {
  it('última lectura + km/día × días transcurridos', () => {
    expect(estimatedKm({ date: d('2026-10-01'), km: 138_500 }, 45, today)).toBe(139_535);
  });

  it('redondea al km entero', () => {
    expect(estimatedKm({ date: d('2026-10-01'), km: 120_000 }, 33.3, d('2026-10-04'))).toBe(
      120_100,
    );
  });

  it('con el auto parado el km no avanza', () => {
    expect(estimatedKm({ date: d('2026-10-01'), km: 120_000 }, 0, today)).toBe(120_000);
  });
});

describe('cambio de odómetro (odómetro virtual)', () => {
  const readings = [
    { date: d('2026-06-01'), km: 110_000 },
    { date: d('2026-09-01'), km: 114_600 }, // 50 km/día
    // Tablero nuevo el 11/09: arranca en 0. El viejo marcaría ~115.100.
    { date: d('2026-09-11'), km: 0, odometerReset: true },
    { date: d('2026-10-01'), km: 1_000 },
  ];

  it('suma un desfase para comparar todo en km totales recorridos', () => {
    const odo = virtualOdometer(readings, 40);
    expect(odo.readings.map((r) => r.km)).toEqual([110_000, 114_600, 115_100, 116_100]);
    expect(odo.offset).toBe(115_100);
  });

  it('el km/día sigue siendo continuo después del cambio', () => {
    const odo = virtualOdometer(readings, 40);
    expect(kmPerDay(odo.readings, today, 40)).toBe(50);
  });

  it('el km de un evento se traduce según el tablero vigente en su fecha', () => {
    const odo = virtualOdometer(readings, 40);
    expect(toVirtualKm(odo, 112_000, d('2026-07-15'))).toBe(112_000);
    expect(toVirtualKm(odo, 500, d('2026-09-20'))).toBe(115_600);
  });

  it('sin cambios de tablero no hay desfase', () => {
    const odo = virtualOdometer(readings.slice(0, 2), 40);
    expect(odo.offset).toBe(0);
    expect(toVirtualKm(odo, 112_000, d('2026-07-15'))).toBe(112_000);
  });
});
