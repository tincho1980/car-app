import { VehicleForm } from '@/components/vehicle-form';
import { createVehicle } from '@/server/actions/vehicles';

// Alta de auto (frame 05). Hasta F04, al continuar va al detalle del auto.
export default function NewVehiclePage() {
  return <VehicleForm action={createVehicle} backHref="/" />;
}
