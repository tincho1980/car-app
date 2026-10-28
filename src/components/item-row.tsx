import { ShieldAlert } from 'lucide-react';
import { cn } from 'cn';
import { consumedFraction } from '@/core/last-done';
import type { ItemStatus } from '@/core/types';
import { STATE_STYLES, StatusPill } from '@/components/status-pill';
import { dueText } from '@/lib/item-text';
import { ItemIcon } from '@/components/item-icon';
import type { PlanItem } from '@/server/db/schemas/plan';

// Fila de vencimiento del detalle (frame 02): ícono, nombre, estado, cuánto falta y barra de
// consumo del intervalo. "Ya lo hice" llega con los eventos (F05).
export function ItemRow({
  item,
  status,
  today,
}: {
  item: PlanItem;
  status: ItemStatus;
  today: Date;
}) {
  const style = STATE_STYLES[status.state];
  const fraction = consumedFraction(item, status, today);

  return (
    <li
      className={cn(
        'flex gap-3 rounded-row border bg-surface p-4',
        status.state === 'overdue' ? 'border-danger' : 'border-border',
      )}
    >
      <span
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-field',
          style.soft,
          style.text,
        )}
      >
        <ItemIcon itemId={item.itemId} category={item.category} className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="flex min-w-0 items-center gap-1.5 text-base font-semibold">
            <span className="truncate">{item.name}</span>
            {item.critical && (
              <ShieldAlert className="size-4 shrink-0 text-warn" aria-label="Crítico" />
            )}
          </p>
          <StatusPill state={status.state} />
        </div>
        <p className="mt-1 text-sm text-text-2">
          {dueText(status, today)}
          {status.lastDone?.estimated && ' (último dato estimado)'}
        </p>
        {status.state !== 'unknown' && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn('h-full rounded-full', style.bar)}
              style={{ width: `${Math.round(fraction * 100)}%` }}
            />
          </div>
        )}
      </div>
    </li>
  );
}
