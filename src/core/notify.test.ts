import { describe, expect, it } from 'vitest';
import { shouldNotify } from '@/core/notify';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const today = d('2026-10-24');

describe('shouldNotify (RN-08)', () => {
  it('sin cambio de estado no notifica', () => {
    expect(shouldNotify('ok', 'ok', undefined, false, today)).toBe(false);
    expect(shouldNotify('soon', 'soon', d('2026-10-01'), false, today)).toBe(false);
  });

  it('notifica al pasar de OK a próximo', () => {
    expect(shouldNotify('ok', 'soon', undefined, false, today)).toBe(true);
  });

  it('notifica al pasar de próximo a vencido', () => {
    expect(shouldNotify('soon', 'overdue', d('2026-10-01'), false, today)).toBe(true);
  });

  it('notifica si salta directo de OK a vencido', () => {
    expect(shouldNotify('ok', 'overdue', undefined, false, today)).toBe(true);
  });

  it('notifica la primera vez que se evalúa un ítem ya próximo', () => {
    expect(shouldNotify(undefined, 'soon', undefined, false, today)).toBe(true);
  });

  it('no notifica cuando mejora (vuelve a OK o de vencido a próximo)', () => {
    expect(shouldNotify('soon', 'ok', d('2026-10-01'), false, today)).toBe(false);
    expect(shouldNotify('overdue', 'soon', d('2026-10-01'), false, today)).toBe(false);
  });

  it('no notifica los ítems "Sin dato"', () => {
    expect(shouldNotify('ok', 'unknown', undefined, false, today)).toBe(false);
  });

  it('si sigue vencido, recuerda a los 7 días del último aviso', () => {
    expect(shouldNotify('overdue', 'overdue', d('2026-10-17'), false, today)).toBe(true);
  });

  it('si sigue vencido, no recuerda antes de los 7 días', () => {
    expect(shouldNotify('overdue', 'overdue', d('2026-10-18'), false, today)).toBe(false);
  });

  it('un ítem pospuesto nunca notifica', () => {
    expect(shouldNotify('ok', 'soon', undefined, true, today)).toBe(false);
    expect(shouldNotify('overdue', 'overdue', d('2026-10-01'), true, today)).toBe(false);
  });
});
