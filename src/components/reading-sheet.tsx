'use client';

import { useActionState, useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { KmInput } from '@/components/km-input';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatKm } from '@/lib/format';
import { addReading } from '@/server/actions/vehicles';

// Hoja "Cargar km" (frame 04, RF-15).
export function ReadingSheet({
  vehicleId,
  lastKm,
  lastDate,
  today,
  open,
  onOpenChange,
}: {
  vehicleId: string;
  lastKm: number;
  // dd/mm/aaaa y aaaa-mm-dd: se formatean en el servidor.
  lastDate: string;
  today: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-[430px]" showCloseButton={false}>
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
        <SheetHeader className="px-5 pt-1 pb-0">
          <SheetTitle className="text-2xl">¿Cuántos km tiene?</SheetTitle>
          <SheetDescription>
            Última lectura: {formatKm(lastKm)} km el {lastDate}
          </SheetDescription>
        </SheetHeader>
        {/* Se vuelve a montar en cada apertura para arrancar sin errores. */}
        {open && (
          <ReadingForm vehicleId={vehicleId} today={today} onSaved={() => onOpenChange(false)} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ReadingForm({
  vehicleId,
  today,
  onSaved,
}: {
  vehicleId: string;
  today: string;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(addReading.bind(null, vehicleId), undefined);
  const [reset, setReset] = useState(false);
  const errors = state?.errors ?? {};

  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-5 px-5 pt-2 pb-6" noValidate>
      {errors.form && (
        <p role="alert" className="rounded-field bg-danger-soft px-4 py-3 text-sm text-danger">
          {errors.form}
        </p>
      )}
      <Field label="Kilometraje" htmlFor="reading-km" error={reset ? undefined : errors.km}>
        <KmInput
          id="reading-km"
          name="km"
          autoFocus
          defaultValue={state?.values?.km}
          invalid={!!errors.km && !reset}
        />
      </Field>

      {(state?.offerReset || reset) && (
        <label className="flex items-start gap-3 rounded-row bg-warn-soft p-4 text-[15px] text-text">
          <input
            type="checkbox"
            name="odometerReset"
            checked={reset}
            onChange={(e) => setReset(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-warn"
          />
          Cambié el tablero u odómetro: seguir desde este valor.
        </label>
      )}

      <Field label="Fecha" htmlFor="reading-date" error={errors.date}>
        <Input
          id="reading-date"
          name="date"
          type="date"
          max={today}
          defaultValue={state?.values?.date ?? today}
          invalid={!!errors.date}
        />
      </Field>

      <Button type="submit" disabled={pending}>
        <Check />
        Guardar km
      </Button>
    </form>
  );
}
