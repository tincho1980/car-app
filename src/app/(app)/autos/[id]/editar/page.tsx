import { notFound } from 'next/navigation';
import { Archive } from 'lucide-react';
import { VehicleForm } from '@/components/vehicle-form';
import { Button } from '@/components/ui/button';
import { archiveVehicle, updateVehicle } from '@/server/actions/vehicles';
import { requireUser } from '@/server/auth';
import { getVehicle } from '@/server/db/repos/vehicles';

// Editar datos del auto / archivar (docs/05).
export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ownerId } = await requireUser();
  const vehicle = await getVehicle(ownerId, id);
  if (!vehicle) notFound();

  return (
    <>
      <VehicleForm
        action={updateVehicle.bind(null, id)}
        vehicle={vehicle}
        backHref={`/autos/${id}`}
      />

      {vehicle.archivedAt === null && (
        <section className="mt-10 border-t border-border pt-6">
          <h2 className="text-base font-semibold">Archivar auto</h2>
          <p className="mt-1 text-sm text-text-2">
            Si lo vendiste o lo diste de baja: deja de generar alertas y conserva el historial. Lo
            podés reactivar cuando quieras.
          </p>
          <form action={archiveVehicle.bind(null, id)} className="mt-4">
            <Button type="submit" variant="secondary">
              <Archive />
              Archivar
            </Button>
          </form>
        </section>
      )}
    </>
  );
}
