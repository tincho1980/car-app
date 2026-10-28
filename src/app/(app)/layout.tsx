import { redirect } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { calendarDayInBuenosAires, toDateInput } from '@/lib/format';
import { vehicleView } from '@/lib/vehicle-view';
import { requireUser } from '@/server/auth';
import { listVehicles } from '@/server/db/repos/vehicles';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Segunda barrera además del proxy.
  const { ownerId } = await requireUser().catch(() => redirect('/login'));

  // La hoja ＋ Cargar necesita los autos activos para "Solo los km".
  const today = calendarDayInBuenosAires(new Date());
  const vehicles = (await listVehicles(ownerId))
    .filter((v) => v.archivedAt === null)
    .map((v) => vehicleView(v, today));

  return (
    <>
      <main className="mx-auto min-h-dvh max-w-[430px] px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[calc(96px+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav vehicles={vehicles} today={toDateInput(today)} />
    </>
  );
}
