import { describe, expect, it } from 'vitest';
import { approxDate, dueText, elapsed } from '@/lib/item-text';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const today = d('2026-10-24');

describe('textos de los vencimientos (frame 02)', () => {
  it('fecha aproximada según la distancia', () => {
    expect(approxDate(d('2026-11-07'), today)).toBe('~14 días');
    expect(approxDate(d('2026-12-18'), today)).toBe('~18/12');
    expect(approxDate(d('2027-03-10'), today)).toBe('~marzo 2027');
  });

  it('tiempo transcurrido', () => {
    expect(elapsed(1)).toBe('1 día');
    expect(elapsed(61)).toBe('2 meses');
    expect(elapsed(400)).toBe('1 año');
  });

  it('próximo por km: faltan km y cuándo', () => {
    expect(
      dueText(
        {
          state: 'soon',
          kmLeft: 700,
          estDueDate: d('2026-11-07'),
          estimated: true,
          snoozed: false,
        },
        today,
      ),
    ).toBe('Faltan ≈ 700 km · ~14 días');
  });

  it('solo por fecha: cuándo vence', () => {
    expect(
      dueText(
        { state: 'ok', estDueDate: d('2027-03-10'), estimated: false, snoozed: false },
        today,
      ),
    ).toBe('Vence ~marzo 2027');
  });

  it('vencido por fecha y por km', () => {
    expect(
      dueText(
        { state: 'overdue', dueDate: d('2026-08-24'), estimated: false, snoozed: false },
        today,
      ),
    ).toBe('Vencido hace 2 meses');
    expect(
      dueText({ state: 'overdue', kmLeft: -350, estimated: true, snoozed: false }, today),
    ).toBe('Vencido hace ≈ 350 km');
  });

  it('sin dato', () => {
    expect(dueText({ state: 'unknown', estimated: false, snoozed: false }, today)).toBe(
      'No sabemos cuándo se hizo. Cargá el último dato.',
    );
  });
});
