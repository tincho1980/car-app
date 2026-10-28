import 'server-only';
import { templateProposal } from '@/lib/template-plan';
import type { ProposalItem } from '@/server/db/schemas/plan';
import type { Vehicle } from '@/server/db/repos/vehicles';

export type ProposedPlan = {
  origin: 'template' | 'ai';
  items: ProposalItem[];
  sources: string[];
};

// RF-05: quien propone el plan de un auto. Hoy, la plantilla; en F10 se suma la IA
// (con la plantilla como respaldo si falla o tarda más de 30 s).
export interface PlanProposer {
  propose(
    vehicle: Pick<Vehicle, 'make' | 'model' | 'year' | 'version' | 'fuel'>,
  ): Promise<ProposedPlan>;
}

export const templateProposer: PlanProposer = {
  async propose(vehicle) {
    const items = templateProposal(vehicle.fuel).map(({ excludedByDefault: _, ...item }) => ({
      ...item,
      critical: item.critical ?? false,
      warnKm: 1_000,
      warnDays: 30,
      verified: false,
      edited: false,
    }));
    return { origin: 'template', items, sources: [] };
  },
};
