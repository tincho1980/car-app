import { z } from 'zod';
import { ORIGINS, ProposalItemSchema } from '@/server/db/schemas/plan';

export const PROPOSAL_STATUSES = ['draft', 'approved', 'discarded'] as const;

// Propuesta de plan (RF-05): borrador hasta que el usuario la aprueba (RN-11, RN-14).
export const PlanProposalSchema = z.object({
  ownerId: z.email(),
  vehicleId: z.string().min(1),
  status: z.enum(PROPOSAL_STATUSES),
  origin: z.enum(ORIGINS.filter((o) => o !== 'manual') as ['ai', 'template']),
  items: z.array(ProposalItemSchema),
  sources: z.array(z.string()).default([]),
  aiRunId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PlanProposalDoc = z.infer<typeof PlanProposalSchema>;
