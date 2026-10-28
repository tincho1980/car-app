import { describe, expect, it } from 'vitest';
import { roundKm } from '@/core/example';

describe('roundKm', () => {
  it('redondea al km entero', () => {
    expect(roundKm(120345.6)).toBe(120346);
  });

  it('nunca devuelve negativos', () => {
    expect(roundKm(-5)).toBe(0);
  });
});
