'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Eliminar un evento pide confirmación (RF-10).
export function DeleteEventButton({ action, noun }: { action: () => Promise<void>; noun: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className="text-danger hover:text-danger"
      >
        <Trash2 />
        Eliminar
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-[430px]" showCloseButton={false}>
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
          <SheetHeader className="px-5 pt-1 pb-0">
            <SheetTitle className="text-2xl">¿Eliminar este {noun}?</SheetTitle>
            <SheetDescription>
              Se borra del historial y se recalculan los vencimientos y el km por día. No se puede
              deshacer.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-5 pt-2 pb-8">
            <form action={action}>
              <Button type="submit" className="bg-danger hover:bg-danger/90">
                <Trash2 />
                Eliminar
              </Button>
            </form>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
