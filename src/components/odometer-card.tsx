'use client';

import { useState } from 'react';
import { PenLine, TrendingUp } from 'lucide-react';
import { ReadingSheet } from '@/components/reading-sheet';
import { formatKm } from '@/lib/format';

// Tarjeta "KM ESTIMADOS HOY" del detalle (frame 02): odómetro con dígitos en cajas.
export function OdometerCard({
  vehicleId,
  estimatedKm,
  kmPerDay,
  lastKm,
  lastDate,
  lastDateShort,
  today,
  openReading = false,
}: {
  vehicleId: string;
  estimatedKm: number;
  kmPerDay: number;
  lastKm: number;
  lastDate: string;
  lastDateShort: string;
  today: string;
  openReading?: boolean;
}) {
  const [open, setOpen] = useState(openReading);

  return (
    <section className="rounded-card border border-transparent bg-odo p-5 text-odo-text dark:border-border">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">
          Km estimados hoy
        </h2>
        <span className="flex items-center gap-1.5 rounded-full bg-odo-digit px-3 py-1 text-[13px] font-semibold">
          <TrendingUp className="size-4" />
          {formatKm(kmPerDay)} km/día
        </span>
      </div>

      <p
        className="mt-3 flex items-center gap-1.5 font-mono text-[34px] font-bold"
        aria-label={`Aproximadamente ${formatKm(estimatedKm)} kilómetros`}
      >
        <span className="mr-1 text-2xl text-text-3" aria-hidden>
          ≈
        </span>
        {[...formatKm(estimatedKm)].map((char, i) =>
          char === '.' ? (
            <span key={i} className="px-0.5 text-text-3" aria-hidden>
              .
            </span>
          ) : (
            <span
              key={i}
              aria-hidden
              className="flex h-14 w-9 items-center justify-center rounded-[8px] bg-odo-digit"
            >
              {char}
            </span>
          ),
        )}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-text-3">
          Real: {formatKm(lastKm)} · {lastDateShort}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 items-center gap-2 rounded-full bg-odo-button px-5 text-[15px] font-semibold text-odo-button-text active:scale-[0.98]"
        >
          <PenLine className="size-5" />
          Cargar km
        </button>
      </div>

      <ReadingSheet
        vehicleId={vehicleId}
        lastKm={lastKm}
        lastDate={lastDate}
        today={today}
        open={open}
        onOpenChange={setOpen}
      />
    </section>
  );
}
