import { cn } from 'cn';
import type { ItemState } from '@/core/types';

// Semáforo único (docs/05): rojo vencido · ámbar próximo · verde ok · gris sin dato.
export const STATE_STYLES: Record<
  ItemState,
  { label: string; text: string; soft: string; bar: string; border: string }
> = {
  overdue: {
    label: 'Vencido',
    text: 'text-danger',
    soft: 'bg-danger-soft',
    bar: 'bg-danger',
    border: 'border-danger',
  },
  soon: {
    label: 'Próximo',
    text: 'text-warn',
    soft: 'bg-warn-soft',
    bar: 'bg-warn',
    border: 'border-border',
  },
  ok: { label: 'OK', text: 'text-ok', soft: 'bg-ok-soft', bar: 'bg-ok', border: 'border-border' },
  unknown: {
    label: 'Sin dato',
    text: 'text-muted',
    soft: 'bg-muted-soft',
    bar: 'bg-muted',
    border: 'border-border',
  },
};

export function StatusPill({ state, className }: { state: ItemState; className?: string }) {
  const style = STATE_STYLES[state];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        style.soft,
        style.text,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', style.bar)} aria-hidden />
      {style.label}
    </span>
  );
}
