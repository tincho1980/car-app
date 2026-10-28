'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { Check, Plus } from 'lucide-react';
import { cn } from 'cn';
import type { ItemState } from '@/core/types';
import { ItemIcon } from '@/components/item-icon';
import { KmInput } from '@/components/km-input';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { formatInterval } from '@/lib/plan-items';
import { savePlanItem, setItemActive } from '@/server/actions/plan';
import { CATEGORIES, CATEGORY_LABELS, type PlanItem } from '@/server/db/schemas/plan';

export type EditorItem = Pick<
  PlanItem,
  | 'itemId'
  | 'name'
  | 'category'
  | 'intervalKm'
  | 'intervalMonths'
  | 'warnKm'
  | 'warnDays'
  | 'critical'
  | 'active'
  | 'origin'
  | 'note'
> & { state?: ItemState };

const ORIGIN_LABELS: Record<PlanItem['origin'], string> = {
  ai: 'IA',
  template: 'Plantilla',
  manual: 'Propio',
};

// Plan aprobado (docs/05 /autos/[id]/plan): editar, agregar y "no aplica" (RF-06, RF-07, RN-10).
export function PlanEditor({ vehicleId, items }: { vehicleId: string; items: EditorItem[] }) {
  const [editing, setEditing] = useState<EditorItem | 'new' | null>(null);

  const groups = CATEGORIES.map((category) => ({
    category,
    items: items.filter((i) => i.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <section key={group.category} className="flex flex-col gap-2">
          <h2 className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">
            {CATEGORY_LABELS[group.category]}
          </h2>
          <ul className="flex flex-col gap-2">
            {group.items.map((item) => (
              <li key={item.itemId}>
                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-row border border-border bg-surface p-4 text-left',
                    !item.active && 'opacity-50',
                  )}
                >
                  <ItemIcon
                    itemId={item.itemId}
                    category={item.category}
                    className="size-5 shrink-0 text-text-2"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-base font-semibold">{item.name}</span>
                      {item.critical && (
                        <span className="text-[11px] font-bold tracking-[0.5px] text-warn uppercase">
                          Crítico
                        </span>
                      )}
                    </span>
                    <span className="block font-mono text-sm text-text-2">
                      {formatInterval(item)}
                    </span>
                    <span className="block text-xs text-text-3">
                      {item.active ? ORIGIN_LABELS[item.origin] : 'No aplica'}
                    </span>
                  </span>
                  {item.active && item.state && <StatusPill state={item.state} />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Button variant="secondary" onClick={() => setEditing('new')}>
        <Plus />
        Agregar ítem
      </Button>

      <PlanItemSheet
        vehicleId={vehicleId}
        item={editing === 'new' ? undefined : (editing ?? undefined)}
        open={editing !== null}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function PlanItemSheet({
  vehicleId,
  item,
  open,
  onClose,
}: {
  vehicleId: string;
  item?: EditorItem;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[90dvh] max-w-[430px] overflow-y-auto"
        showCloseButton={false}
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border" />
        {open && (
          <PlanItemForm
            key={item?.itemId ?? 'new'}
            vehicleId={vehicleId}
            item={item}
            onSaved={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PlanItemForm({
  vehicleId,
  item,
  onSaved,
}: {
  vehicleId: string;
  item?: EditorItem;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    savePlanItem.bind(null, vehicleId, item?.itemId ?? null),
    undefined,
  );
  const [active, setActive] = useState(item?.active ?? true);
  const [toggling, startToggle] = useTransition();
  const errors = state?.errors ?? {};
  const value = (key: string, fallback?: string | number) =>
    state?.values?.[key] ?? (fallback === undefined ? '' : String(fallback));

  useEffect(() => {
    if (state?.ok) onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-5 px-5 pb-6" noValidate>
      <SheetHeader className="p-0 pt-1">
        <SheetTitle className="text-2xl">{item ? 'Editar ítem' : 'Agregar ítem'}</SheetTitle>
        <SheetDescription>
          {item?.note ?? 'Vence lo que llegue primero: los km o los meses.'}
        </SheetDescription>
      </SheetHeader>

      <Field label="Nombre" htmlFor="name" error={errors.name}>
        <Input
          id="name"
          name="name"
          defaultValue={value('name', item?.name)}
          invalid={!!errors.name}
        />
      </Field>
      <Field label="Categoría" htmlFor="category" error={errors.category}>
        <Select
          id="category"
          name="category"
          defaultValue={value('category', item?.category ?? 'otro')}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cada (km)" htmlFor="intervalKm" error={errors.intervalKm}>
          <KmInput
            id="intervalKm"
            name="intervalKm"
            defaultValue={value('intervalKm', item?.intervalKm)}
            invalid={!!errors.intervalKm}
          />
        </Field>
        <Field label="Cada (meses)" htmlFor="intervalMonths" error={errors.intervalMonths}>
          <Input
            id="intervalMonths"
            name="intervalMonths"
            inputMode="numeric"
            className="font-mono"
            defaultValue={value('intervalMonths', item?.intervalMonths)}
            invalid={!!errors.intervalMonths}
          />
        </Field>
        <Field label="Avisar antes (km)" htmlFor="warnKm" error={errors.warnKm}>
          <KmInput id="warnKm" name="warnKm" defaultValue={value('warnKm', item?.warnKm ?? 1000)} />
        </Field>
        <Field label="Avisar antes (días)" htmlFor="warnDays" error={errors.warnDays}>
          <Input
            id="warnDays"
            name="warnDays"
            inputMode="numeric"
            className="font-mono"
            defaultValue={value('warnDays', item?.warnDays ?? 30)}
          />
        </Field>
      </div>

      {item && (
        <div className="flex items-center justify-between gap-3 rounded-row bg-bg p-4">
          <span>
            <span className="block text-[15px] font-semibold">Aplica a este auto</span>
            <span className="block text-sm text-text-2">
              Si no aplica, no genera avisos. Se puede volver a activar.
            </span>
          </span>
          <Switch
            checked={active}
            disabled={toggling}
            label="Aplica a este auto"
            onCheckedChange={(next) => {
              setActive(next);
              startToggle(() => setItemActive(vehicleId, item.itemId, next));
            }}
          />
        </div>
      )}

      <Button type="submit" disabled={pending}>
        <Check />
        Guardar
      </Button>
    </form>
  );
}
