import 'server-only';
import { ObjectId, type WithId } from 'mongodb';
import { db } from '@/server/db/client';
import { PlanProposalSchema, type PlanProposalDoc } from '@/server/db/schemas/plan-proposal';

const proposals = db.collection<PlanProposalDoc>('planProposals');

export type PlanProposal = PlanProposalDoc & { id: string };

function toProposal({ _id, ...doc }: WithId<PlanProposalDoc>): PlanProposal {
  return { ...doc, id: _id.toString() };
}

export async function getDraftProposal(
  ownerId: string,
  vehicleId: string,
): Promise<PlanProposal | null> {
  const doc = await proposals.findOne(
    { ownerId, vehicleId, status: 'draft' },
    { sort: { createdAt: -1 } },
  );
  return doc && toProposal(doc);
}

export async function insertProposal(doc: PlanProposalDoc): Promise<string> {
  const { insertedId } = await proposals.insertOne(PlanProposalSchema.parse(doc));
  return insertedId.toString();
}

export async function setProposalStatus(
  ownerId: string,
  id: string,
  status: PlanProposalDoc['status'],
  now: Date,
): Promise<void> {
  if (!ObjectId.isValid(id)) return;
  await proposals.updateOne(
    { _id: new ObjectId(id), ownerId },
    { $set: { status, updatedAt: now } },
  );
}
