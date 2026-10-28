import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlanReview } from '@/components/plan-review';
import { startPlan } from '@/server/actions/plan';
import { requireUser } from '@/server/auth';
import { getDraftProposal } from '@/server/db/repos/plan-proposals';
import { getVehicle } from '@/server/db/repos/vehicles';

// Revisar y aprobar la propuesta de plan (frame 06).
export default async function ReviewPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ownerId } = await requireUser();
  const vehicle = await getVehicle(ownerId, id);
  if (!vehicle) notFound();
  if (vehicle.planApprovedAt) redirect(`/autos/${id}/plan`);

  const proposal = await getDraftProposal(ownerId, id);
  if (!proposal) {
    return (
      <div className="rounded-card border border-border bg-surface p-5">
        <p className="font-semibold">Todavía no hay una propuesta de plan</p>
        <form action={startPlan.bind(null, id)} className="mt-5">
          <Button type="submit">Armar propuesta</Button>
        </form>
      </div>
    );
  }

  return (
    <PlanReview
      vehicleId={id}
      title={vehicle.alias ?? `${vehicle.make} ${vehicle.model}`}
      initialItems={proposal.items}
    />
  );
}
