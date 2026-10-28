import { describe, expect, it } from 'vitest';
import { isAllowedEmail } from '@/server/allowed-email';

const allowed = 'yo@example.com';

describe('isAllowedEmail', () => {
  it('acepta el email permitido', () => {
    expect(isAllowedEmail('yo@example.com', allowed)).toBe(true);
  });

  it('ignora mayúsculas y espacios', () => {
    expect(isAllowedEmail('  Yo@Example.COM ', allowed)).toBe(true);
  });

  it('rechaza cualquier otro email', () => {
    expect(isAllowedEmail('otro@example.com', allowed)).toBe(false);
  });

  it('rechaza un email vacío o ausente', () => {
    expect(isAllowedEmail('', allowed)).toBe(false);
    expect(isAllowedEmail(null, allowed)).toBe(false);
    expect(isAllowedEmail(undefined, allowed)).toBe(false);
  });
});
