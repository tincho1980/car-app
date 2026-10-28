'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, Info } from 'lucide-react';
import { cn } from 'cn';
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
import { Switch } from '@/components/ui/switch';
import { parseKm } from '@/lib/format';
import { ItemIcon } from '@/components/item-icon';
import { formatInterval } from '@/lib/plan-items';
import { approvePlan } from '@/server/actions/plan';
import { CATEGORIES, CATEGORY_LABELS, type ProposalItem } from '@/server/db/schemas/plan';

// Revisar plan (frame 06, RF-05): incluir o descartar, editar intervalos y verificar críticos.
export function PlanReview({
  vehicleId,
  title,
  initialItems,
}: {
  vehicleId: string;
  title: string;
  initialItems: ProposalItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<ProposalItem | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const groups = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        items: items.filter((i) => i.category === category),
      })).filter((g) => g.items.length > 0),
    [items],
  );
  const includedCount = items.filter((i) => i.included).length;
  const missingVerification = items.some((i) => i.critical && i.included && !i.verified);

  function update(itemId: string, patch: Partial<ProposalItem>) {
    setItems((current) => current.map((i) => (i.itemId === itemId ? { ...i, ...patch } : i)));
  }

  function approve() {
    setError(undefined);
    startTransition(async () => {
      const result = await approvePlan(
        vehicleId,
        items.map(({ itemId, intervalKm, intervalMonths, included, verified }) => ({
          itemId,
          intervalKm,
          intervalMonths,
          included,
          verified,
        })),
      );
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <Link
          href={`/autos/${vehicleId}`}
          aria-label="Volver"
          className="flex size-11 items-center justify-center rounded-button border border-border bg-surface text-text"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">Paso 2 de 3</p>
          <h1 className="truncate text-2xl font-bold">Plan de {title}</h1>
        </div>
      </header>

      <div className="flex gap-3 rounded-row bg-accent-soft p-4">
        <Info className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="text-[15px] font-semibold">Plan sugerido: verificalo antes de aprobar</p>
          <p className="mt-0.5 text-sm text-text-2">
            Compará con el manual o con tu taller. Tocá un ítem para editar el intervalo. Nada
            genera avisos hasta que lo apruebes.
          </p>
        </div>
      </div>

      {groups.map((group) => (
        <section key={group.category} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">
              {CATEGORY_LABELS[group.category]}
            </h2>
            <span className="text-xs font-semibold text-accent">
              {group.items.length} {group.items.length === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {group.items.map((item) => (
              <ReviewRow
                key={item.itemId}
                item={item}
                onEdit={() => setEditing(item)}
                onChange={(patch) => update(item.itemId, patch)}
              />
            ))}
          </ul>
        </section>
      ))}

      <div className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] flex flex-col gap-2 bg-bg pt-2 pb-3">
        {error && (
          <p role="alert" className="rounded-field bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        <Button onClick={approve} disabled={pending || missingVerification || includedCount === 0}>
          <Check />
          Aprobar plan ({includedCount} {includedCount === 1 ? 'ítem' : 'ítems'})
        </Button>
        {missingVerification && (
          <p className="text-center text-xs text-text-3">
            Tildá &quot;Verificado&quot; en los ítems críticos para aprobar.
          </p>
        )}
      </div>

      <IntervalSheet
        item={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (editing) update(editing.itemId, patch);
          setEditing(null);
        }}
      />
    </div>
  );
}

function ReviewRow({
  item,
  onEdit,
  onChange,
}: {
  item: ProposalItem;
  onEdit: () => void;
  onChange: (patch: Partial<ProposalItem>) => void;
}) {
  const highlighted = item.critical && item.included;

  return (
    <li
      className={cn(
        'rounded-row border p-4',
        highlighted ? 'border-warn bg-warn-soft' : 'border-border bg-surface',
        !item.included && 'opacity-50',
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ItemIcon
            itemId={item.itemId}
            category={item.category}
            className={cn('size-5 shrink-0', highlighted ? 'text-warn' : 'text-text-2')}
          />
          <span className="min-w-0">
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
              {item.edited && ' · editado'}
            </span>
          </span>
        </button>
        <Switch
          checked={item.included}
          onCheckedChange={(included) => onChange({ included })}
          label={`Incluir ${item.name}`}
        />
      </div>
      {highlighted && (
        <label className="mt-3 ml-8 flex items-center gap-2.5 text-[15px] font-medium">
          <input
            type="checkbox"
            checked={item.verified}
            onChange={(e) => onChange({ verified: e.target.checked })}
            className="size-5 accent-accent"
          />
          Verificado con manual o taller
        </label>
      )}
    </li>
  );
}

function IntervalSheet({
  item,
  onClose,
  onSave,
}: {
  item: ProposalItem | null;
  onClose: () => void;
  onSave: (patch: Partial<ProposalItem>) => void;
}) {
  const [error, setError] = useState<string>();

  return (
    <Sheet open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-w-[430px]" showCloseButton={false}>
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
        {item && (
          <form
            key={item.itemId}
            className="flex flex-col gap-5 px-5 pb-6"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const intervalKm = parseKm(String(data.get('intervalKm') ?? ''));
              const monthsText = String(data.get('intervalMonths') ?? '').trim();
              const intervalMonths = monthsText === '' ? undefined : Number(monthsText);
              if (intervalKm === undefined && intervalMonths === undefined) {
                setError('Poné un intervalo en km, en meses o en los dos.');
                return;
              }
              if (intervalMonths !== undefined && !(intervalMonths >= 1 && intervalMonths <= 240)) {
                setError('Revisá los meses.');
                return;
              }
              setError(undefined);
              onSave({
                intervalKm,
                intervalMonths,
                edited:
                  intervalKm !== item.intervalKm || intervalMonths !== item.intervalMonths
                    ? true
                    : item.edited,
              });
            }}
          >
            <SheetHeader className="p-0 pt-1">
              <SheetTitle className="text-2xl">{item.name}</SheetTitle>
              <SheetDescription>
                {item.note ?? 'Vence lo que llegue primero: los km o los meses.'}
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Cada (km)" htmlFor="intervalKm">
                <KmInput
                  id="intervalKm"
                  name="intervalKm"
                  defaultValue={item.intervalKm?.toString()}
                />
              </Field>
              <Field label="Cada (meses)" htmlFor="intervalMonths">
                <Input
                  id="intervalMonths"
                  name="intervalMonths"
                  inputMode="numeric"
                  className="font-mono"
                  defaultValue={item.intervalMonths?.toString()}
                />
              </Field>
            </div>
            {error && <p className="-mt-2 text-sm text-danger">{error}</p>}
            <Button type="submit">
              <Check />
              Listo
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
