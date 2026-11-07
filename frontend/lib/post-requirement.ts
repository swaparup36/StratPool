import { parseUnits } from "viem";
import { requirementsMatchingQueue } from "@/lib/queues/requirements-matching";
import { requirementSchema } from "@/lib/requirements";
import { CHAIN_IDS, findToken } from "@/lib/tokens";
import { db } from "@/src/prisma/db";

// Shared by the web form and the MCP tool. investorId must come from the caller's verified identity.
export async function postRequirement(investorId: string, input: unknown) {
  const parsed = requirementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((issue) => issue.message) } as const;
  const requirement = parsed.data;

  const token = await findToken(CHAIN_IDS[requirement.chain], requirement.asset);
  if (!token) return { ok: false, errors: [`No token with symbol ${requirement.asset} exists on ${requirement.chain}`] } as const;
  if ((requirement.amount.split(".")[1]?.length ?? 0) > token.decimals) {
    return { ok: false, errors: [`${token.symbol} supports at most ${token.decimals} decimal places`] } as const;
  }

  const created = await db.orm.public.InvestorRequirement.create({
    ...requirement,
    amount: parseUnits(requirement.amount, token.decimals).toString(),
    asset: token.symbol,
    investorId,
  });

  // enqueue the requirement
  const enqueueResult = await requirementsMatchingQueue.add(
    "match-requirement",
    {
      reqId: created.id,
    },
    {
      jobId: `requirements-matching-${created.id}`,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log(`Enqueued requirement matching job for requirement ${created.id} with job ID ${enqueueResult.id}`);

  return { ok: true, requirement: created } as const;
}
