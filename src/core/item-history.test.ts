import { describe, expect, it } from 'vitest';
import { itemHistory } from '@/core/item-history';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

const events = [
  { id: 'c', date: d('2026-09-15'), km: 119_300, itemIds: ['pastillas', 'aceite'] },
  { id: 'a', date: d('2023-05-01'), km: 55_000, itemIds: ['pastillas'] },
  { id: 'x', date: d('2025-01-10'), km: 90_000, itemIds: ['aceite'] },
  { id: 'b', date: d('2024-11-20'), km: 87_000, itemIds: ['pastillas'] },
];

describe('itemHistory (RF-28)', () => {
  it('lista cada vez que se hizo, del más reciente al más viejo, con los km entre cambios', () => {
    const history = itemHistory(events, 'pastillas');
    expect(history.entries.map((e) => [e.eventId, e.kmSincePrevious])).toEqual([
      ['c', 32_300],
      ['b', 32_000],
      ['a', undefined],
    ]);
  });

  it('calcula el promedio de km entre cambios', () => {
    expect(itemHistory(events, 'pastillas').averageKm).toBe(32_150);
  });

  it('con una sola vez no hay promedio', () => {
    expect(itemHistory(events, 'frenos').entries).toEqual([]);
    expect(itemHistory([events[1]], 'pastillas').averageKm).toBeUndefined();
  });

  it('el estado inicial cuenta como la primera vez', () => {
    const history = itemHistory(events, 'aceite', { date: d('2024-01-05'), km: 80_000 });
    expect(history.entries.map((e) => [e.eventId ?? 'inicial', e.kmSincePrevious])).toEqual([
      ['c', 29_300],
      ['x', 10_000],
      ['inicial', undefined],
    ]);
    expect(history.averageKm).toBe(19_650);
  });
});
