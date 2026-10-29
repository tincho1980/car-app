import { cn } from 'cn';

// Chip del diseño (frames 08 y 10): seleccionado en accent, si no, blanco con borde.
export function Chip({
  selected,
  className,
  ...props
}: React.ComponentProps<'button'> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold transition-colors',
        selected
          ? 'border-accent bg-accent text-primary-foreground'
          : 'border-border bg-surface text-text hover:bg-surface-2',
        className,
      )}
      {...props}
    />
  );
}
