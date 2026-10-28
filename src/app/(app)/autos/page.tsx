import Link from 'next/link';
import { Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { VehicleList } from '@/components/vehicle-list';
import { calendarDayInBuenosAires } from '@/lib/format';
import { vehicleView } from '@/lib/vehicle-view';
import { requireUser } from '@/server/auth';
import { listVehicles } from '@/server/db/repos/vehicles';

// Lista de autos, activos y archivados (RF-04).
export default async function VehiclesPage() {
  const { ownerId } = await requireUser();
  const today = calendarDayInBuenosAires(new Date());
  const vehicles = (await listVehicles(ownerId)).map((v) => vehicleView(v, today));
  const active = vehicles.filter((v) => !v.archived);
  const archived = vehicles.filter((v) => v.archived);

  return (
    <>
      <h1 className="text-2xl font-bold">Autos</h1>
      <div className="mt-6 flex flex-col gap-3">
        {active.length > 0 ? (
          <VehicleList vehicles={active} />
        ) : (
          <p className="text-sm text-text-2">No tenés autos activos.</p>
        )}
        <Link href="/autos/nuevo" className={buttonVariants({ variant: 'secondary' })}>
          <Plus />
          Agregar auto
        </Link>
      </div>

      {archived.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-bold tracking-[0.8px] text-text-3 uppercase">Archivados</h2>
          <p className="mt-1 mb-3 text-sm text-text-2">
            No generan alertas. Conservan el historial.
          </p>
          <VehicleList vehicles={archived} />
        </section>
      )}
    </>
  );
}
