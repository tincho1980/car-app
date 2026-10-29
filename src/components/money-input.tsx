'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/field';
import { formatKm } from '@/lib/format';

// Monto en pesos con teclado numérico: "$ 85.000" (docs/05). Se guarda en centavos.
export function MoneyInput({
  defaultValue,
  invalid,
  ...props
}: Omit<React.ComponentProps<'input'>, 'defaultValue' | 'onChange' | 'value'> & {
  defaultValue?: string;
  invalid?: boolean;
}) {
  const [value, setValue] = useState(() => format(defaultValue ?? ''));

  return (
    <Input
      {...props}
      invalid={invalid}
      inputMode="decimal"
      autoComplete="off"
      className="font-mono"
      placeholder="$ 0"
      value={value}
      onChange={(e) => setValue(format(e.target.value))}
    />
  );
}

// Miles con punto y hasta dos decimales con coma: "$ 85.000,50".
function format(raw: string): string {
  const [int = '', ...dec] = raw.replace(/[^\d,]/g, '').split(',');
  const digits = int.replace(/^0+(?=\d)/, '');
  if (digits === '' && dec.length === 0) return '';
  const pesos = digits === '' ? '0' : formatKm(Number(digits));
  return dec.length > 0 ? `$ ${pesos},${dec.join('').slice(0, 2)}` : `$ ${pesos}`;
}
