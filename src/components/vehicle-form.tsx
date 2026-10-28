'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react';
import { KmInput } from '@/components/km-input';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { toDateInput } from '@/lib/format';
import type { FormState } from '@/server/actions/form';
import { FUEL_LABELS, FUELS } from '@/server/db/schemas/vehicle';
import type { Vehicle } from '@/server/db/repos/vehicles';

type Action = (prev: FormState | undefined, formData: FormData) => Promise<FormState>;

// Alta (frame 05) y edición de un auto. En la edición el km no se toca: cambia con las lecturas.
export function VehicleForm({
  action,
  vehicle,
  backHref,
}: {
  action: Action;
  vehicle?: Pick<
    Vehicle,
    | 'make'
    | 'model'
    | 'year'
    | 'version'
    | 'fuel'
    | 'alias'
    | 'plate'
    | 'purchaseDate'
    | 'defaultKmPerDay'
  >;
  backHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isNew = !vehicle;
  const errors = state?.errors ?? {};
  const value = (key: string, fallback?: string | number) =>
    state?.values?.[key] ?? (fallback === undefined ? '' : String(fallback));
  const hasExtras = Boolean(vehicle?.alias || vehicle?.plate || vehicle?.purchaseDate);
  const [showExtras, setShowExtras] = useState(
    !isNew || hasExtras || Boolean(errors.alias || errors.plate || errors.defaultKmPerDay),
  );

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <header className="flex items-center gap-3">
        <Link
          href={backHref}
          aria-label="Volver"
          className="flex size-11 items-center justify-center rounded-button border border-border bg-surface text-text"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <div>
          {isNew && (
            <p className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">Paso 1 de 3</p>
          )}
          <h1 className="text-2xl font-bold">{isNew ? 'Nuevo auto' : 'Editar auto'}</h1>
        </div>
      </header>

      {isNew && (
        <p className="text-[15px] text-text-2">
          Con estos datos te proponemos un plan de mantenimiento. Lo revisás antes de activarlo.
        </p>
      )}

      {errors.form && (
        <p role="alert" className="rounded-field bg-danger-soft px-4 py-3 text-sm text-danger">
          {errors.form}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-3 gap-y-5">
        <Field label="Marca" htmlFor="make" error={errors.make}>
          <Input
            id="make"
            name="make"
            autoComplete="off"
            defaultValue={value('make', vehicle?.make)}
            invalid={!!errors.make}
          />
        </Field>
        <Field label="Modelo" htmlFor="model" error={errors.model}>
          <Input
            id="model"
            name="model"
            autoComplete="off"
            defaultValue={value('model', vehicle?.model)}
            invalid={!!errors.model}
          />
        </Field>
        <Field label="Año" htmlFor="year" error={errors.year}>
          <Input
            id="year"
            name="year"
            inputMode="numeric"
            maxLength={4}
            className="font-mono"
            defaultValue={value('year', vehicle?.year)}
            invalid={!!errors.year}
          />
        </Field>
        <Field label="Combustible" htmlFor="fuel" error={errors.fuel}>
          <Select
            id="fuel"
            name="fuel"
            defaultValue={value('fuel', vehicle?.fuel ?? 'nafta')}
            invalid={!!errors.fuel}
          >
            {FUELS.map((fuel) => (
              <option key={fuel} value={fuel}>
                {FUEL_LABELS[fuel]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Versión / motor"
        htmlFor="version"
        error={errors.version}
        hint={'Cuanto más preciso, mejor el plan (ej. "1.4 Fire 8v", "1.6 16v").'}
      >
        <Input
          id="version"
          name="version"
          autoComplete="off"
          defaultValue={value('version', vehicle?.version)}
          invalid={!!errors.version}
        />
      </Field>

      {isNew && (
        <Field label="Km actuales" htmlFor="km" error={errors.km}>
          <KmInput id="km" name="km" defaultValue={value('km')} invalid={!!errors.km} />
        </Field>
      )}

      {showExtras ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            <Field label="Alias" htmlFor="alias" error={errors.alias}>
              <Input
                id="alias"
                name="alias"
                placeholder="El Palio"
                defaultValue={value('alias', vehicle?.alias)}
                invalid={!!errors.alias}
              />
            </Field>
            <Field label="Patente" htmlFor="plate" error={errors.plate}>
              <Input
                id="plate"
                name="plate"
                autoCapitalize="characters"
                className="font-mono uppercase"
                defaultValue={value('plate', vehicle?.plate)}
                invalid={!!errors.plate}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            <Field label="Fecha de compra" htmlFor="purchaseDate" error={errors.purchaseDate}>
              <Input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                defaultValue={value(
                  'purchaseDate',
                  vehicle?.purchaseDate && toDateInput(vehicle.purchaseDate),
                )}
                invalid={!!errors.purchaseDate}
              />
            </Field>
            <Field label="Km por día" htmlFor="defaultKmPerDay" error={errors.defaultKmPerDay}>
              <KmInput
                id="defaultKmPerDay"
                name="defaultKmPerDay"
                defaultValue={value('defaultKmPerDay', vehicle?.defaultKmPerDay ?? 40)}
                invalid={!!errors.defaultKmPerDay}
              />
            </Field>
          </div>
          <p className="-mt-2 text-xs text-text-3">
            Los km por día se usan para estimar hasta que haya dos lecturas.
          </p>
        </div>
      ) : (
        <div className="flex items-baseline justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowExtras(true)}
            className="text-[15px] font-semibold text-accent"
          >
            Más datos (opcional)
          </button>
          <span className="text-xs text-text-3">alias · patente · fecha de compra</span>
        </div>
      )}

      <Button type="submit" disabled={pending} className="mt-2">
        {isNew ? <ArrowRight /> : <Check />}
        {isNew ? 'Continuar' : 'Guardar cambios'}
      </Button>
    </form>
  );
}
