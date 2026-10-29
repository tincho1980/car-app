'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Car, ChevronRight, PenLine, Plus, Wrench, type LucideIcon } from 'lucide-react';
import { ReadingSheet } from '@/components/reading-sheet';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatKm } from '@/lib/format';

export type AddSheetVehicle = {
  id: string;
  title: string;
  estimatedKm: number;
  lastKm: number;
  lastDate: string;
};

// Hoja "＋ Cargar" (frame 03, docs/05): Service o trabajo y Solo los km. F09 suma "Foto del
// ticket". Con más de un auto, primero se elige cuál.
export function AddSheet({ vehicles, today }: { vehicles: AddSheetVehicle[]; today: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'actions' | 'choose'>('actions');
  const [mode, setMode] = useState<'km' | 'service'>('km');
  const router = useRouter();
  const [readingFor, setReadingFor] = useState<AddSheetVehicle | null>(null);
  const single = vehicles.length === 1 ? vehicles[0] : undefined;

  function openReading(vehicle: AddSheetVehicle) {
    setOpen(false);
    setReadingFor(vehicle);
  }

  function openService(vehicle: AddSheetVehicle) {
    setOpen(false);
    router.push(`/autos/${vehicle.id}/eventos/nuevo`);
  }

  function choose(next: 'km' | 'service') {
    if (single) return next === 'km' ? openReading(single) : openService(single);
    setMode(next);
    setStep('choose');
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setStep('actions');
        }}
      >
        <button
          type="button"
          aria-label="Cargar"
          onClick={() => setOpen(true)}
          className="-mt-7 flex size-14 items-center justify-center rounded-full bg-accent text-primary-foreground shadow-lg shadow-accent/30 transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-95"
        >
          <Plus className="size-7" strokeWidth={2.25} />
        </button>
        <SheetContent side="bottom" className="mx-auto max-w-[430px]" showCloseButton={false}>
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
          <SheetHeader className="px-5 pt-1 pb-0">
            <SheetTitle className="text-2xl">
              {step === 'choose' ? '¿De qué auto?' : 'Cargar'}
            </SheetTitle>
            {single && (
              <SheetDescription>
                {single.title} · ≈ {formatKm(single.estimatedKm)} km
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="flex flex-col gap-3 px-5 pt-2 pb-8">
            {vehicles.length === 0 ? (
              <OptionLink
                href="/autos/nuevo"
                icon={Car}
                title="Agregar un auto"
                detail="Para cargar km o services, primero cargá tu auto."
                onClick={() => setOpen(false)}
              />
            ) : step === 'choose' ? (
              vehicles.map((vehicle) => (
                <Option
                  key={vehicle.id}
                  icon={Car}
                  title={vehicle.title}
                  detail={`≈ ${formatKm(vehicle.estimatedKm)} km`}
                  onClick={() => (mode === 'km' ? openReading(vehicle) : openService(vehicle))}
                />
              ))
            ) : (
              <>
                <Option
                  icon={Wrench}
                  title="Service o trabajo"
                  detail="Cambio de aceite, reparación, cubiertas…"
                  onClick={() => choose('service')}
                />
                <Option
                  icon={PenLine}
                  title="Solo los km"
                  detail="Actualizá el odómetro en 2 segundos."
                  onClick={() => choose('km')}
                />
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {readingFor && (
        <ReadingSheet
          vehicleId={readingFor.id}
          lastKm={readingFor.lastKm}
          lastDate={readingFor.lastDate}
          today={today}
          open
          onOpenChange={(next) => !next && setReadingFor(null)}
        />
      )}
    </>
  );
}

const optionClassName =
  'flex w-full items-center gap-4 rounded-row bg-bg p-4 text-left transition-colors hover:bg-surface-2';

function OptionBody({ icon: Icon, title, detail }: OptionProps) {
  return (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-field bg-accent-soft text-accent">
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-text">{title}</span>
        <span className="block text-sm text-text-2">{detail}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-text-3" />
    </>
  );
}

type OptionProps = { icon: LucideIcon; title: string; detail: string };

function Option({ onClick, ...props }: OptionProps & { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={optionClassName}>
      <OptionBody {...props} />
    </button>
  );
}

function OptionLink({
  href,
  onClick,
  ...props
}: OptionProps & { href: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className={optionClassName}>
      <OptionBody {...props} />
    </Link>
  );
}
