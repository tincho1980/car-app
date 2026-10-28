import { describe, expect, it } from 'vitest';
import { itemStatus } from '@/core/item-status';
import { estimatedKm } from '@/core/odometer';
import type { PlanItemRule } from '@/core/types';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const today = d('2026-10-24');

describe('caso de referencia: correa de distribución (02-requerimientos §3)', () => {
  const correa: PlanItemRule = {
    itemId: 'correa',
    intervalKm: 60_000,
    intervalMonths: 48,
    warnKm: 1_000,
    warnDays: 30,
    active: true,
  };
  const lastDone = { date: d('2023-03-10'), km: 82_000 };
  const lastReading = { date: d('2026-10-01'), km: 138_500 };
  const statusOn = (day: Date) =>
    itemStatus(correa, lastDone, estimatedKm(lastReading, 45, day), 45, day);

  it('hoy (24/10/2026) faltan 2.465 km y vence por km ~18/12/2026: OK', () => {
    expect(statusOn(today)).toMatchObject({
      state: 'ok',
      dueKm: 142_000,
      dueDate: d('2027-03-10'),
      kmLeft: 2_465,
      estDueDate: d('2026-12-18'),
      daysLeft: 55,
      estimated: true,
    });
  });

  it('el 25/11/2026 todavía está OK (faltan 1.025 km)', () => {
    expect(statusOn(d('2026-11-25'))).toMatchObject({ state: 'ok', kmLeft: 1_025 });
  });

  it('el 26/11/2026 pasa a próximo (faltan 980 km)', () => {
    expect(statusOn(d('2026-11-26'))).toMatchObject({ state: 'soon', kmLeft: 980 });
  });

  it('al pasar los 142.000 km está vencido', () => {
    expect(statusOn(d('2026-12-20'))).toMatchObject({ state: 'overdue' });
  });
});

describe('ítem solo por fecha: líquido de frenos cada 24 meses', () => {
  const liquido: PlanItemRule = {
    itemId: 'liquido-frenos',
    intervalMonths: 24,
    warnKm: 1_000,
    warnDays: 30,
    active: true,
  };

  it('vence a los 24 meses del último cambio y no proyecta km', () => {
    const status = itemStatus(liquido, { date: d('2025-03-01'), km: 100_000 }, 121_000, 50, today);
    expect(status).toMatchObject({
      state: 'ok',
      dueDate: d('2027-03-01'),
      estDueDate: d('2027-03-01'),
      estimated: false,
    });
    expect(status.dueKm).toBeUndefined();
    expect(status.kmLeft).toBeUndefined();
  });

  it('a 30 días o menos del vencimiento está próximo', () => {
    const status = itemStatus(liquido, { date: d('2024-11-15'), km: 100_000 }, 121_000, 50, today);
    expect(status).toMatchObject({ state: 'soon', daysLeft: 22 });
  });

  it('el mismo día del vencimiento ya está vencido', () => {
    const status = itemStatus(liquido, { date: d('2024-10-24'), km: 100_000 }, 121_000, 50, today);
    expect(status.state).toBe('overdue');
  });
});

describe('ítem solo por km: rotación de cubiertas cada 10.000 km', () => {
  const rotacion: PlanItemRule = {
    itemId: 'rotacion',
    intervalKm: 10_000,
    warnKm: 1_000,
    warnDays: 30,
    active: true,
  };
  const lastDone = { date: d('2026-01-10'), km: 130_000 };

  it('a 1.000 km o menos está próximo, con fecha estimada por el uso', () => {
    expect(itemStatus(rotacion, lastDone, 139_535, 45, today)).toMatchObject({
      state: 'soon',
      dueKm: 140_000,
      kmLeft: 465,
      estDueDate: d('2026-11-03'),
      estimated: true,
    });
  });

  it('pasado el km de vencimiento está vencido', () => {
    expect(itemStatus(rotacion, lastDone, 140_200, 45, today)).toMatchObject({
      state: 'overdue',
      kmLeft: -200,
    });
  });

  it('con el auto parado (0 km/día) no hay fecha estimada, pero el estado sale del km', () => {
    const status = itemStatus(rotacion, lastDone, 139_535, 0, today);
    expect(status.state).toBe('soon');
    expect(status.estDueDate).toBeUndefined();
  });
});

describe('último realizado desconocido', () => {
  it('queda "Sin dato" (unknown), sin vencimientos', () => {
    const amortiguadores: PlanItemRule = {
      itemId: 'amortiguadores',
      intervalKm: 60_000,
      warnKm: 1_000,
      warnDays: 30,
      active: true,
    };
    const status = itemStatus(amortiguadores, undefined, 121_000, 50, today);
    expect(status).toMatchObject({ state: 'unknown', estimated: false, snoozed: false });
    expect(status.dueKm).toBeUndefined();
  });
});

describe('pospuesto', () => {
  const aceite: PlanItemRule = {
    itemId: 'aceite',
    intervalKm: 10_000,
    intervalMonths: 12,
    warnKm: 1_000,
    warnDays: 30,
    active: true,
  };
  const vencido = { date: d('2025-06-01'), km: 110_000 };

  it('pospuesto por fecha: sigue vencido, pero marcado como pospuesto', () => {
    const status = itemStatus(
      { ...aceite, snooze: { untilDate: d('2026-10-31') } },
      vencido,
      121_000,
      50,
      today,
    );
    expect(status).toMatchObject({ state: 'overdue', snoozed: true });
  });

  it('el posponer por fecha termina ese día', () => {
    const status = itemStatus(
      { ...aceite, snooze: { untilDate: today } },
      vencido,
      121_000,
      50,
      today,
    );
    expect(status.snoozed).toBe(false);
  });

  it('pospuesto por km: silenciado hasta llegar a ese km', () => {
    const snoozed = { ...aceite, snooze: { untilKm: 121_500 } };
    expect(itemStatus(snoozed, vencido, 121_000, 50, today).snoozed).toBe(true);
    expect(itemStatus(snoozed, vencido, 121_500, 50, today).snoozed).toBe(false);
  });
});
