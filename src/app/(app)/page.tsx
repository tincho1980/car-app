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
  const vehicles = await listVehicles(ownerId);
  const active = vehicles.filter((v) => v.archivedAt === null);

  if (active.length === 1) redirect(`/autos/${active[0].id}`);

  if (active.length === 0) {
    const hasArchived = vehicles.length > 0;
    return (
      <>
        <h1 className="text-2xl font-bold">Inicio</h1>
        <div className="mt-6 rounded-card border border-border bg-surface p-5">
          <p className="font-semibold">
            {hasArchived ? 'No tenés autos activos' : 'Todavía no cargaste ningún auto'}
          </p>
          <p className="mt-1 text-sm text-text-2">
            Cargalo y acá vas a ver los km estimados y los próximos vencimientos.
          </p>
          <Link href="/autos/nuevo" className={buttonVariants({ className: 'mt-5' })}>
            <Plus />
            Agregar auto
          </Link>
          {hasArchived && (
            <Link
              href="/autos"
              className="mt-4 block text-center text-[15px] font-semibold text-accent"
            >
              Ver autos archivados
            </Link>
          )}
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
