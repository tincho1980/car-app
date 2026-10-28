import type { z } from 'zod';
import { parseDateInput, parseKm } from '@/lib/format';

// Estado que devuelven las Server Actions de formularios (useActionState).
export type FormState = {
  ok?: boolean;
  errors?: Record<string, string>;
  // Lo que se envió, para que el formulario no se vacíe si hay errores.
  values?: Record<string, string>;
  // Km menor a una lectura anterior: ofrecer "Cambié el tablero u odómetro" (RN-07).
  offerReset?: boolean;
};

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    errors[key] ??= issue.message;
  }
  return errors;
}

export function formValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === 'string') as [string, string][],
  );
}

export function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export function optionalNumber(formData: FormData, key: string): number | undefined {
  const value = text(formData, key).trim();
  return value === '' ? undefined : Number(value);
}

export function optionalKm(formData: FormData, key: string): number | undefined {
  return parseKm(text(formData, key));
}

export function optionalDate(formData: FormData, key: string): Date | undefined {
  return parseDateInput(text(formData, key));
}
