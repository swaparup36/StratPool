import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/src/prisma/db";
import { failure, readStrategy, unauthorized } from "./shared";
import { strategyVerificationQueue } from "@/lib/queues/strategy-verification";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.userId) return unauthorized();

    const parsed = await readStrategy(req);
    if (parsed instanceof NextResponse) return parsed;

    const created = await db.orm.public.Strategy.create({
      ...parsed.strategy,
      strategistId: session.userId,
      // Nested, so a failed asset can't leave a strategy behind without its assets.
      acceptedAssets: (assets) => assets.create(parsed.assets),
    });

    // enque the strategy for verification
    const enqueueResult = await strategyVerificationQueue.add(
      "verify-strategy",
      {
        strategyId: created.id,
      },
      {
        jobId: `strategy-verification-${created.id}`,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    console.log(`Enqueued strategy verification job for strategy ${created.id} with job ID ${enqueueResult.id}`);

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    return failure("create", error);
  }
}
