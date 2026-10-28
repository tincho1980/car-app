import { describe, expect, it } from 'vitest';
import { vehicleStatus } from '@/core/vehicle-status';
import type { MaintenanceEvent, OdometerReading, PlanItemRule } from '@/core/types';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const today = d('2026-10-24');

const rule = (itemId: string, extra: Partial<PlanItemRule>): PlanItemRule => ({
  itemId,
  warnKm: 1_000,
  warnDays: 30,
  active: true,
  ...extra,
});

const plan = [
  rule('aceite', { intervalKm: 10_000, intervalMonths: 12 }),
  rule('correa', { intervalKm: 60_000, intervalMonths: 48 }),
  rule('amortiguadores', { intervalKm: 60_000 }),
  rule('aceite-caja', { intervalKm: 60_000, active: false }),
];

// 4.500 km en 90 días: 50 km/día. Km estimado hoy: 120.000 + 50 × 23 = 121.150.
const readings: OdometerReading[] = [
  { date: d('2026-07-03'), km: 115_500 },
  { date: d('2026-10-01'), km: 120_000 },
];

const events: MaintenanceEvent[] = [
  { id: 'e1', date: d('2025-12-01'), km: 112_000, itemIds: ['aceite'] },
  { id: 'e2', date: d('2026-09-15'), km: 119_300, itemIds: ['aceite'] },
  { id: 'e3', date: d('2022-06-01'), km: 70_000, itemIds: ['correa'] },
];

const byId = (result: ReturnType<typeof vehicleStatus>, itemId: string) =>
  result.items.find((i) => i.itemId === itemId);

describe('vehicleStatus (RN-09)', () => {
  const result = vehicleStatus({ plan, events, readings, defaultKmPerDay: 40 }, today);

  it('calcula km/día y km estimado del auto', () => {
    expect(result.kmPerDay).toBe(50);
    expect(result.estimatedKm).toBe(121_150);
  });

  it('el último realizado sale del evento más reciente del ítem', () => {
    expect(byId(result, 'aceite')).toMatchObject({
      state: 'ok',
      lastDone: { eventId: 'e2', km: 119_300 },
      dueKm: 129_300,
      kmLeft: 8_150,
    });
  });

  it('un ítem vence por fecha aunque falten km', () => {
    expect(byId(result, 'correa')).toMatchObject({ state: 'overdue', dueDate: d('2026-06-01') });
  });

  it('un ítem sin eventos queda "Sin dato"', () => {
    expect(byId(result, 'amortiguadores')?.state).toBe('unknown');
  });

  it('los ítems "no aplica" no reciben estado (RN-10)', () => {
    expect(byId(result, 'aceite-caja')).toBeUndefined();
  });

  it('borrar el evento más reciente cambia el último realizado', () => {
    const sinE2 = vehicleStatus(
      { plan, events: events.filter((e) => e.id !== 'e2'), readings, defaultKmPerDay: 40 },
      today,
    );
    expect(byId(sinE2, 'aceite')).toMatchObject({
      state: 'soon',
      lastDone: { eventId: 'e1' },
      dueKm: 122_000,
      kmLeft: 850,
    });
  });

  it('con dos eventos el mismo día, gana el de más km', () => {
    const mismoDia: MaintenanceEvent[] = [
      { id: 'a', date: d('2026-09-15'), km: 119_000, itemIds: ['aceite'] },
      { id: 'b', date: d('2026-09-15'), km: 119_300, itemIds: ['aceite'] },
    ];
    const status = vehicleStatus({ plan, events: mismoDia, readings, defaultKmPerDay: 40 }, today);
    expect(byId(status, 'aceite')?.lastDone?.eventId).toBe('b');
  });

  it('ignora eventos con fecha futura', () => {
    const futuro: MaintenanceEvent[] = [
      ...events,
      { id: 'f', date: d('2026-12-01'), km: 125_000, itemIds: ['aceite'] },
    ];
    const status = vehicleStatus({ plan, events: futuro, readings, defaultKmPerDay: 40 }, today);
    expect(byId(status, 'aceite')?.lastDone?.eventId).toBe('e2');
  });
});

describe('cambio de odómetro', () => {
  // Tablero nuevo el 11/09/2026, arranca en 0 (el viejo marcaría ~115.100).
  const conCambio: OdometerReading[] = [
    { date: d('2026-06-01'), km: 110_000 },
    { date: d('2026-09-01'), km: 114_600 },
    { date: d('2026-09-11'), km: 0, odometerReset: true },
    { date: d('2026-10-01'), km: 1_000 },
  ];
  const service: MaintenanceEvent[] = [
    { id: 's', date: d('2026-07-15'), km: 112_000, itemIds: ['aceite'] },
  ];

  it('un service anterior al cambio sigue venciendo en el km correcto', () => {
    const result = vehicleStatus(
      { plan, events: service, readings: conCambio, defaultKmPerDay: 40 },
      today,
    );
    // Km del tablero nuevo: 1.000 + 50 × 23 = 2.150. El aceite vence 10.000 km después del
    // service: en el tablero nuevo, a los 6.900 km.
    expect(result.estimatedKm).toBe(2_150);
    expect(byId(result, 'aceite')).toMatchObject({
      state: 'ok',
      dueKm: 6_900,
      kmLeft: 4_750,
      lastDone: { km: 112_000 },
    });
  });
});

describe('sin lecturas de odómetro', () => {
  it('usa el km/día default y no estima km: los ítems solo por km quedan "Sin dato"', () => {
    const conRotacion = [...plan, rule('rotacion', { intervalKm: 10_000 })];
    const conService: MaintenanceEvent[] = [
      ...events,
      { id: 'r', date: d('2026-08-01'), km: 118_000, itemIds: ['rotacion'] },
    ];
    const result = vehicleStatus(
      { plan: conRotacion, events: conService, readings: [], defaultKmPerDay: 40 },
      today,
    );
    expect(result.kmPerDay).toBe(40);
    expect(result.estimatedKm).toBeUndefined();
    expect(byId(result, 'rotacion')?.state).toBe('unknown');
    // Lo que tiene intervalo por fecha se sigue evaluando.
    expect(byId(result, 'correa')?.state).toBe('overdue');
  });
});
