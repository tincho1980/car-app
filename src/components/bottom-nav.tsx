'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Gauge, Settings, type LucideIcon } from 'lucide-react';
import { cn } from 'cn';
import { AddSheet, type AddSheetVehicle } from '@/components/add-sheet';

// Bottom Nav del diseño: Inicio · ＋ Cargar · Ajustes.
export function BottomNav({ vehicles, today }: { vehicles: AddSheetVehicle[]; today: string }) {
  const pathname = usePathname();
  const isSettings = pathname.startsWith('/ajustes');

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid h-[72px] max-w-[430px] grid-cols-3 items-center">
        <NavLink href="/" label="Inicio" icon={Gauge} active={!isSettings} />
        <div className="flex justify-center">
          <AddSheet vehicles={vehicles} today={today} />
        </div>
        <NavLink href="/ajustes" label="Ajustes" icon={Settings} active={isSettings} />
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold',
        active ? 'text-accent' : 'text-text-3',
      )}
    >
      <Icon className="size-6" />
      {label}
    </Link>
  );
}
