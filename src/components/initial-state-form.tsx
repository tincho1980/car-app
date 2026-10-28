'use client';

import { useActionState } from 'react';
import { ArrowRight, CircleHelp } from 'lucide-react';
import { cn } from 'cn';
import { ItemIcon } from '@/components/item-icon';
import { KmInput } from '@/components/km-input';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import type { FormState } from '@/server/actions/form';
import type { Category } from '@/server/db/schemas/plan';

type Action = (prev: FormState | undefined, formData: FormData) => Promise<FormState>;

// Tarjeta de una pregunta del estado inicial (frame 07, RF-08).
export function InitialStateForm({
  action,
  itemId,
  category,
  critical,
  question,
  defaultMonth,
  defaultKm,
  maxMonth,
}: {
  action: Action;
  itemId: string;
  category: Category;
  critical: boolean;
  question: string;
  defaultMonth?: string;
  defaultKm?: string;
  maxMonth: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const errors = state?.errors ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <div className="rounded-card border border-border bg-surface p-5">
        <span
          className={cn(
            'flex size-14 items-center justify-center rounded-row',
            critical ? 'bg-warn-soft text-warn' : 'bg-accent-soft text-accent',
          )}
        >
          <ItemIcon itemId={itemId} category={category} className="size-7" />
        </span>
        <h2 className="mt-5 text-[22px] leading-tight font-bold">{question}</h2>
        <p className="mt-3 text-[15px] text-text-2">
          Con este dato calculamos el próximo cambio. Alcanza con la fecha o con los km. Si no lo
          sabés, lo tomamos como desconocido y te avisamos para revisarlo.
        </p>

        {errors.form && (
          <p
            role="alert"
            className="mt-4 rounded-field bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            {errors.form}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Field label="Fecha" htmlFor="month" error={errors.month}>
            <Input
              id="month"
              name="month"
              type="month"
              max={maxMonth}
              defaultValue={state?.values?.month ?? defaultMonth}
              invalid={!!errors.month}
            />
          </Field>
          <Field label="A los km" htmlFor="km" error={errors.km}>
            <KmInput
              id="km"
              name="km"
              defaultValue={state?.values?.km ?? defaultKm}
              invalid={!!errors.km}
            />
          </Field>
        </div>
      </div>

      <Button type="submit" name="answer" value="known" disabled={pending}>
        <ArrowRight />
        Siguiente
      </Button>
      <Button type="submit" name="answer" value="unknown" variant="secondary" disabled={pending}>
        <CircleHelp />
        No sé
      </Button>
    </form>
  );
}
