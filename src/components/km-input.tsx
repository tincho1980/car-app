'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/field';
import { formatKm, parseKm } from '@/lib/format';

// Km con teclado numérico y punto de miles mientras se escribe (docs/05: "120.000").
export function KmInput({
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
      inputMode="numeric"
      autoComplete="off"
      className="font-mono"
      value={value}
      onChange={(e) => setValue(format(e.target.value))}
    />
  );
}

function format(raw: string): string {
  const km = parseKm(raw.replace(/\D/g, ''));
  return km === undefined ? '' : formatKm(km);
}
