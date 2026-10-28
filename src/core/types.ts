// Tipos del motor de alertas. Las fechas son días calendario: Date a las 00:00 UTC.
// El km es siempre un entero.

export type OdometerReading = {
  date: Date;
  km: number;
  // La lectura es la primera de un tablero/odómetro nuevo (RN-07).
  odometerReset?: boolean;
};

export type MaintenanceEvent = {
  id: string;
  date: Date;
  km: number;
  itemIds: string[];
};

export type Snooze = {
  untilDate?: Date;
  untilKm?: number;
};

export type PlanItemRule = {
  itemId: string;
  intervalKm?: number;
  intervalMonths?: number;
  warnKm: number;
  warnDays: number;
  // false = "no aplica" (RN-10): no genera estado ni alertas.
  active: boolean;
  snooze?: Snooze;
  // Estado inicial (RF-08): cuándo se hizo antes de empezar a usar la app. null = "No sé".
  initialDone?: LastDone | null;
};

export type LastDone = {
  date: Date;
  km: number;
  eventId?: string;
  // La fecha o el km se estimó a partir del otro dato (se muestra con ≈).
  estimated?: boolean;
};

export type ItemState = 'ok' | 'soon' | 'overdue' | 'unknown';

export type ItemStatus = {
  state: ItemState;
  dueKm?: number;
  dueDate?: Date;
  // Vencimiento estimado: el más cercano entre la fecha por km (RN-05) y dueDate.
  estDueDate?: Date;
  kmLeft?: number;
  daysLeft?: number;
  // true si estDueDate sale de proyectar el km (se muestra con ≈).
  estimated: boolean;
  // Pospuesto: el estado no cambia, solo se silencian las notificaciones.
  snoozed: boolean;
  lastDone?: LastDone;
};
