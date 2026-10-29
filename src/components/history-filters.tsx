'use client';

import { useState } from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Filtros del historial por ítem y rango de fechas (RF-27). Viajan en la URL (formulario GET).
export function HistoryFilters({
  items,
  current,
}: {
  items: { itemId: string; name: string }[];
  current: { tipo?: string; item?: string; desde?: string; hasta?: string };
}) {
  const [open, setOpen] = useState(false);
  const active = Boolean(current.item || current.desde || current.hasta);

  return (
    <>
      <button
        type="button"
        aria-label="Filtros"
        onClick={() => setOpen(true)}
        className={cn(
          'relative flex size-11 shrink-0 items-center justify-center rounded-button border bg-surface',
          active ? 'border-accent text-accent' : 'border-border text-text',
        )}
      >
        <SlidersHorizontal className="size-5" />
        {active && <span className="absolute top-2 right-2 size-2 rounded-full bg-accent" />}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-[430px]" showCloseButton={false}>
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
          <form method="get" className="flex flex-col gap-5 px-5 pb-6">
            <SheetHeader className="p-0 pt-1">
              <SheetTitle className="text-2xl">Filtrar historial</SheetTitle>
              <SheetDescription>Por ítem del plan y por fechas.</SheetDescription>
            </SheetHeader>
            {current.tipo && <input type="hidden" name="tipo" value={current.tipo} />}
            <Field label="Ítem" htmlFor="item">
              <Select id="item" name="item" defaultValue={current.item ?? ''}>
                <option value="">Todos los ítems</option>
                {items.map((i) => (
                  <option key={i.itemId} value={i.itemId}>
                    {i.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Desde" htmlFor="desde">
                <Input id="desde" name="desde" type="date" defaultValue={current.desde} />
              </Field>
              <Field label="Hasta" htmlFor="hasta">
                <Input id="hasta" name="hasta" type="date" defaultValue={current.hasta} />
              </Field>
            </div>
            <Button type="submit" onClick={() => setOpen(false)}>
              <Check />
              Aplicar
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
