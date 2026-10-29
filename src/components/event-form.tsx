'use client';

import { useActionState, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Package,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { cn } from 'cn';
import { ItemIcon } from '@/components/item-icon';
import { KmInput } from '@/components/km-input';
import { MoneyInput } from '@/components/money-input';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Field, Input } from '@/components/ui/field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { parseMoney } from '@/lib/format';
import type { PartRow } from '@/lib/event-parts';
import type { FormState } from '@/server/actions/form';
import { EVENT_TYPE_LABELS, EVENT_TYPES, type EventType } from '@/server/db/schemas/event';
import type { Category } from '@/server/db/schemas/plan';

type Action = (prev: FormState | undefined, formData: FormData) => Promise<FormState>;

export type PickableItem = { itemId: string; name: string; category: Category };

export type EventFormDefaults = {
  type: EventType;
  itemIds: string[];
  date: string; // aaaa-mm-dd
  km: string;
  totalCost?: string;
  shop?: string;
  notes?: string;
  parts: PartRow[];
};

// Formulario de evento (frame 08, RF-09): tipo, qué se hizo, fecha, km, costo, taller,
// repuestos y notas. "Cargar con foto del ticket" (F09) y comprobantes (F08) llegan después.
export function EventForm({
  action,
  vehicleTitle,
  items,
  defaults,
  backHref,
  isEdit = false,
  today,
}: {
  action: Action;
  vehicleTitle: string;
  items: PickableItem[];
  defaults: EventFormDefaults;
  backHref: string;
  isEdit?: boolean;
  today: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [type, setType] = useState<EventType>(defaults.type);
  const [itemIds, setItemIds] = useState(defaults.itemIds);
  const [parts, setParts] = useState<PartRow[]>(defaults.parts);
  const [showParts, setShowParts] = useState(defaults.parts.length > 0);
  const [picking, setPicking] = useState(false);
  const errors = state?.errors ?? {};
  const value = (key: string, fallback?: string) => state?.values?.[key] ?? fallback ?? '';
  const byId = useMemo(() => new Map(items.map((i) => [i.itemId, i])), [items]);
  const noun = type === 'service' ? 'service' : 'trabajo';

  const partsPayload = JSON.stringify(
    parts.map((p) => ({
      desc: p.desc,
      brand: p.brand || undefined,
      partNumber: p.partNumber || undefined,
      qty: p.qty,
      unitPrice: p.unitPrice ? parseMoney(p.unitPrice) : undefined,
    })),
  );

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="type" value={type} />
      {itemIds.map((id) => (
        <input key={id} type="hidden" name="itemIds" value={id} />
      ))}
      <input type="hidden" name="parts" value={partsPayload} />

      <header className="flex items-center gap-3">
        <Link
          href={backHref}
          aria-label="Volver"
          className="flex size-11 items-center justify-center rounded-button border border-border bg-surface text-text"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold tracking-[0.8px] text-text-3 uppercase">
            {vehicleTitle}
          </p>
          <h1 className="text-2xl font-bold">{isEdit ? `Editar ${noun}` : `Registrar ${noun}`}</h1>
        </div>
      </header>

      {errors.form && (
        <p role="alert" className="rounded-field bg-danger-soft px-4 py-3 text-sm text-danger">
          {errors.form}
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">Tipo</h2>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {EVENT_TYPES.map((t) => (
            <Chip key={t} selected={type === t} onClick={() => setType(t)}>
              {t === 'service' && <Wrench className="size-4" />}
              {EVENT_TYPE_LABELS[t]}
            </Chip>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">Qué se hizo</h2>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex items-center gap-1 text-sm font-semibold text-accent"
          >
            <Plus className="size-4" />
            Agregar
          </button>
        </div>
        {itemIds.length === 0 ? (
          <p className="text-sm text-text-3">
            Elegí los ítems del plan que se hicieron. Si es una reparación imprevista, podés dejarlo
            vacío.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {itemIds.map((id) => {
              const item = byId.get(id);
              if (!item) return null;
              return (
                <span
                  key={id}
                  className="inline-flex h-10 items-center gap-2 rounded-field bg-accent-soft pr-2 pl-3 text-sm font-semibold text-accent"
                >
                  <ItemIcon itemId={item.itemId} category={item.category} className="size-4" />
                  {item.name}
                  <button
                    type="button"
                    aria-label={`Quitar ${item.name}`}
                    onClick={() => setItemIds((ids) => ids.filter((x) => x !== id))}
                    className="flex size-6 items-center justify-center rounded-full hover:bg-accent/10"
                  >
                    <X className="size-4" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-x-3 gap-y-5">
        <Field label="Fecha" htmlFor="date" error={errors.date}>
          <Input
            id="date"
            name="date"
            type="date"
            max={today}
            defaultValue={value('date', defaults.date)}
            invalid={!!errors.date}
          />
        </Field>
        <Field label="Km" htmlFor="km" error={errors.km}>
          <KmInput
            id="km"
            name="km"
            defaultValue={value('km', defaults.km)}
            invalid={!!errors.km}
          />
        </Field>
        <Field label="Costo total" htmlFor="totalCost" error={errors.totalCost}>
          <MoneyInput
            id="totalCost"
            name="totalCost"
            defaultValue={value('totalCost', defaults.totalCost)}
            invalid={!!errors.totalCost}
          />
        </Field>
        <Field label="Taller" htmlFor="shop" error={errors.shop}>
          <Input id="shop" name="shop" defaultValue={value('shop', defaults.shop)} />
        </Field>
      </div>

      <div className="rounded-row border border-border bg-surface">
        <button
          type="button"
          onClick={() => setShowParts((v) => !v)}
          aria-expanded={showParts}
          className="flex w-full items-center gap-3 p-4 text-left"
        >
          <Package className="size-5 text-text-2" />
          <span className="flex-1 text-base font-semibold">
            Repuestos {parts.length > 0 && <span className="text-text-3">{parts.length}</span>}
          </span>
          <ChevronDown
            className={cn('size-5 text-text-3 transition-transform', showParts && 'rotate-180')}
          />
        </button>
        {showParts && (
          <div className="flex flex-col gap-3 border-t border-border p-4">
            {errors.parts && <p className="text-sm text-danger">{errors.parts}</p>}
            {parts.map((part, i) => (
              <PartFields
                key={i}
                part={part}
                onChange={(next) => setParts((ps) => ps.map((p, j) => (j === i ? next : p)))}
                onRemove={() => setParts((ps) => ps.filter((_, j) => j !== i))}
              />
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setParts((ps) => [...ps, { desc: '', qty: 1 }])}
            >
              <Plus />
              Agregar repuesto
            </Button>
          </div>
        )}
      </div>

      <Field label="Notas" htmlFor="notes" error={errors.notes}>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={value('notes', defaults.notes)}
          className="w-full rounded-field border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </Field>

      <Button type="submit" disabled={pending}>
        <Check />
        {isEdit ? 'Guardar cambios' : `Guardar ${noun}`}
      </Button>

      <ItemPicker
        open={picking}
        items={items}
        selected={itemIds}
        onClose={() => setPicking(false)}
        onDone={(ids) => {
          setItemIds(ids);
          setPicking(false);
        }}
      />
    </form>
  );
}

function PartFields({
  part,
  onChange,
  onRemove,
}: {
  part: PartRow;
  onChange: (part: PartRow) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-field bg-bg p-3">
      <div className="flex gap-2">
        <Input
          aria-label="Descripción del repuesto"
          placeholder="Descripción"
          value={part.desc}
          onChange={(e) => onChange({ ...part, desc: e.target.value })}
        />
        <button
          type="button"
          aria-label="Quitar repuesto"
          onClick={onRemove}
          className="flex size-13 shrink-0 items-center justify-center rounded-field text-text-3 hover:bg-surface-2"
        >
          <Trash2 className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          aria-label="Marca"
          placeholder="Marca"
          value={part.brand ?? ''}
          onChange={(e) => onChange({ ...part, brand: e.target.value })}
        />
        <Input
          aria-label="Número de parte"
          placeholder="N.º de parte"
          className="font-mono"
          value={part.partNumber ?? ''}
          onChange={(e) => onChange({ ...part, partNumber: e.target.value })}
        />
        <Input
          aria-label="Cantidad"
          placeholder="Cant."
          inputMode="numeric"
          className="font-mono"
          value={String(part.qty)}
          onChange={(e) =>
            onChange({ ...part, qty: Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1) })
          }
        />
        <Input
          aria-label="Precio unitario"
          placeholder="$ precio"
          inputMode="decimal"
          className="font-mono"
          value={part.unitPrice ?? ''}
          onChange={(e) => onChange({ ...part, unitPrice: e.target.value })}
        />
      </div>
    </div>
  );
}

function ItemPicker({
  open,
  items,
  selected,
  onClose,
  onDone,
}: {
  open: boolean;
  items: PickableItem[];
  selected: string[];
  onClose: () => void;
  onDone: (ids: string[]) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[85dvh] max-w-[430px]"
        showCloseButton={false}
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border" />
        {open && <ItemPickerBody items={items} selected={selected} onDone={onDone} />}
      </SheetContent>
    </Sheet>
  );
}

function ItemPickerBody({
  items,
  selected,
  onDone,
}: {
  items: PickableItem[];
  selected: string[];
  onDone: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState(new Set(selected));
  const q = query.trim().toLowerCase();
  const visible = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;

  return (
    <div className="flex min-h-0 flex-col gap-3 px-5 pb-6">
      <SheetHeader className="p-0 pt-1">
        <SheetTitle className="text-2xl">Qué se hizo</SheetTitle>
        <SheetDescription>Elegí los ítems del plan que cubre este trabajo.</SheetDescription>
      </SheetHeader>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-3" />
        <Input
          aria-label="Buscar ítem"
          placeholder="Buscar"
          className="pl-11"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <ul className="-mx-1 flex min-h-0 flex-col overflow-y-auto px-1">
        {visible.map((item) => (
          <li key={item.itemId}>
            <label className="flex items-center gap-3 rounded-field px-2 py-3 hover:bg-surface-2">
              <input
                type="checkbox"
                checked={chosen.has(item.itemId)}
                onChange={(e) =>
                  setChosen((set) => {
                    const next = new Set(set);
                    if (e.target.checked) next.add(item.itemId);
                    else next.delete(item.itemId);
                    return next;
                  })
                }
                className="size-5 accent-accent"
              />
              <ItemIcon
                itemId={item.itemId}
                category={item.category}
                className="size-5 text-text-2"
              />
              <span className="text-[15px]">{item.name}</span>
            </label>
          </li>
        ))}
        {visible.length === 0 && <li className="px-2 py-3 text-sm text-text-3">Sin resultados.</li>}
      </ul>
      <Button
        type="button"
        onClick={() => onDone(items.map((i) => i.itemId).filter((id) => chosen.has(id)))}
      >
        <Check />
        Listo ({chosen.size})
      </Button>
    </div>
  );
}
