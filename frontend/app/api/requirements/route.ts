import { NextResponse } from "next/server";
import { parseUnits } from "viem";
import { failure, rejected, unauthorized } from "@/app/api/strategies/shared";
import { requirementSchema } from "@/lib/requirements";
import { getSession } from "@/lib/session";
import { CHAIN_IDS, findToken } from "@/lib/tokens";
import { db } from "@/src/prisma/db";
import { requirementsMatchingQueue } from "@/lib/queues/requirements-matching";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.userId) return unauthorized();

    const parsed = requirementSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return rejected(parsed.error.issues.map((issue) => issue.message));
    const requirement = parsed.data;

    const token = await findToken(CHAIN_IDS[requirement.chain], requirement.asset);
    if (!token) return rejected([`No token with symbol ${requirement.asset} exists on ${requirement.chain}`]);
    if ((requirement.amount.split(".")[1]?.length ?? 0) > token.decimals) {
      return rejected([`${token.symbol} supports at most ${token.decimals} decimal places`]);
    }

    const created = await db.orm.public.InvestorRequirement.create({
      ...requirement,
      amount: parseUnits(requirement.amount, token.decimals).toString(),
      asset: token.symbol,
      investorId: session.userId,
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

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return failure("create", error, "requirement");
  }
}
