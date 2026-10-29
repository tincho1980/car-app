import { describe, expect, it } from 'vitest';
import { EventInputSchema } from '@/server/db/schemas/event';

const service = {
  type: 'service',
  itemIds: ['aceite-filtro', 'filtro-aire'],
  date: new Date('2026-10-27T00:00:00Z'),
  km: 121_350,
  totalCost: 85_000_00,
  shop: 'Lubri Norte',
};

describe('EventInputSchema', () => {
  it('acepta un service con ítems, costo en centavos y taller', () => {
    const parsed = EventInputSchema.parse(service);
    expect(parsed.parts).toEqual([]);
    expect(parsed.totalCost).toBe(8_500_000);
  });

  it('un evento sin ítems del plan ni costo es válido', () => {
    const parsed = EventInputSchema.parse({
      type: 'reparacion',
      date: service.date,
      km: 121_350,
    });
    expect(parsed.itemIds).toEqual([]);
    expect(parsed.totalCost).toBeUndefined();
  });

  it('rechaza un monto con decimales (no está en centavos)', () => {
    expect(EventInputSchema.safeParse({ ...service, totalCost: 85_000.5 }).success).toBe(false);
  });

  it('rechaza la fecha faltante y los km negativos', () => {
    expect(EventInputSchema.safeParse({ ...service, date: undefined }).success).toBe(false);
    expect(EventInputSchema.safeParse({ ...service, km: -10 }).success).toBe(false);
  });

  it('un repuesto necesita descripción; la cantidad default es 1', () => {
    expect(EventInputSchema.safeParse({ ...service, parts: [{ desc: ' ', qty: 1 }] }).success).toBe(
      false,
    );
    const parsed = EventInputSchema.parse({ ...service, parts: [{ desc: 'Filtro de aceite' }] });
    expect(parsed.parts[0].qty).toBe(1);
  });

  it('rechaza un tipo que no existe', () => {
    expect(EventInputSchema.safeParse({ ...service, type: 'lavado' }).success).toBe(false);
  });
});
