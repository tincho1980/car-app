import { ChevronDown } from 'lucide-react';
import { cn } from 'cn';

// Campo del diseño (frame 00): etiqueta, control y mensaje de error o ayuda.
export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-text-2">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-text-3">{hint}</p>
      )}
    </div>
  );
}

export function inputClassName(invalid?: boolean) {
  return cn(
    // El borde de 2 px del diseño se arma con ring, así el campo no salta al enfocarlo.
    'h-13 w-full rounded-field border bg-surface px-4 text-base text-text outline-none transition-colors placeholder:text-text-3 focus:border-accent focus:ring-1 focus:ring-accent',
    invalid
      ? 'border-danger ring-1 ring-danger focus:border-danger focus:ring-danger'
      : 'border-border',
  );
}

export function Input({
  invalid,
  className,
  ...props
}: React.ComponentProps<'input'> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
      className={cn(inputClassName(invalid), className)}
      {...props}
    />
  );
}

export function Select({
  invalid,
  className,
  children,
  ...props
}: React.ComponentProps<'select'> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(inputClassName(invalid), 'appearance-none pr-10', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-text-3" />
    </div>
  );
}
