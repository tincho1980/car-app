import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { VehicleList } from '@/components/vehicle-list';
import { calendarDayInBuenosAires } from '@/lib/format';
import { vehicleView } from '@/lib/vehicle-view';
import { requireUser } from '@/server/auth';
import { listVehicles } from '@/server/db/repos/vehicles';

// Inicio (docs/05): con 1 auto va directo a su detalle; con 2+, la lista (tarjetas en F06).
export default async function HomePage() {
  const { ownerId } = await requireUser();
  const active = (await listVehicles(ownerId)).filter((v) => v.archivedAt === null);

  if (active.length === 1) redirect(`/autos/${active[0].id}`);

  if (active.length === 0) {
    return (
      <>
        <h1 className="text-2xl font-bold">Inicio</h1>
        <div className="mt-6 rounded-card border border-border bg-surface p-5">
          <p className="font-semibold">Todavía no cargaste ningún auto</p>
          <p className="mt-1 text-sm text-text-2">
            Cargalo y acá vas a ver los km estimados y los próximos vencimientos.
          </p>
          <Link href="/autos/nuevo" className={buttonVariants({ className: 'mt-5' })}>
            <Plus />
            Agregar auto
          </Link>
        </div>
      </>
    );
  }

  const today = calendarDayInBuenosAires(new Date());
  return (
    <>
      <h1 className="text-2xl font-bold">Tus autos</h1>
      <div className="mt-6">
        <VehicleList vehicles={active.map((v) => vehicleView(v, today))} />
      </div>
    </>
  );
}
