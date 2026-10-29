import { formatMoney } from '@/lib/format';

// Un repuesto tal como se edita en el formulario: el precio en pesos, como se escribe.
export type PartRow = {
  desc: string;
  brand?: string;
  partNumber?: string;
  qty: number;
  unitPrice?: string;
};

export function partsToRows(
  parts: { desc: string; brand?: string; partNumber?: string; qty: number; unitPrice?: number }[],
): PartRow[] {
  return parts.map((p) => ({
    desc: p.desc,
    brand: p.brand,
    partNumber: p.partNumber,
    qty: p.qty,
    unitPrice: p.unitPrice !== undefined ? formatMoney(p.unitPrice) : undefined,
  }));
}
