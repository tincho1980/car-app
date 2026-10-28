'use client';

import { Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Hoja "＋ Cargar" (docs/05-pantallas.md). Las acciones llegan en F03 (Cargar km) y F05 (Registrar service).
export function AddSheet() {
  return (
    <Sheet>
      <SheetTrigger
        aria-label="Cargar"
        className="-mt-7 flex size-14 items-center justify-center rounded-full bg-accent text-primary-foreground shadow-lg shadow-accent/30 transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-95"
      >
        <Plus className="size-7" strokeWidth={2.25} />
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-w-[430px]">
        <SheetHeader className="px-5 pt-6 pb-10">
          <SheetTitle>Cargar</SheetTitle>
          <SheetDescription>Todavía no hay acciones disponibles.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
