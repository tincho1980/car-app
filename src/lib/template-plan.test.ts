import { describe, expect, it } from 'vitest';
import { TEMPLATE_PLAN, templateProposal } from '@/lib/template-plan';

const included = (fuel: Parameters<typeof templateProposal>[0]) =>
  templateProposal(fuel)
    .filter((i) => i.included)
    .map((i) => i.itemId);

describe('plantilla genérica (Anexo A)', () => {
  it('tiene los 17 ítems, cada uno con al menos un intervalo', () => {
    expect(TEMPLATE_PLAN).toHaveLength(17);
    for (const item of TEMPLATE_PLAN) {
      expect(item.intervalKm ?? item.intervalMonths).toBeDefined();
    }
  });

  it('los ids no se repiten', () => {
    const ids = TEMPLATE_PLAN.map((i) => i.itemId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('la correa de distribución y el líquido de frenos son críticos', () => {
    const critical = TEMPLATE_PLAN.filter((i) => i.critical).map((i) => i.itemId);
    expect(critical).toEqual(['correa-distribucion', 'liquido-frenos']);
  });

  it('en nafta propone 16 ítems: el aceite de caja arranca descartado', () => {
    expect(included('nafta')).toHaveLength(16);
    expect(included('nafta')).not.toContain('aceite-caja');
    expect(included('nafta')).toContain('bujias');
  });

  it('en diésel descarta las bujías', () => {
    expect(included('diesel')).not.toContain('bujias');
  });

  it('en eléctricos descarta aceite, correas, bujías y filtro de combustible', () => {
    const electrico = included('electrico');
    expect(electrico).not.toContain('aceite-filtro');
    expect(electrico).not.toContain('correa-distribucion');
    expect(electrico).toContain('liquido-frenos');
  });
});
