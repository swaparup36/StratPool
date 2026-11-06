import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/src/prisma/db";
import { failure, readStrategy, unauthorized } from "../shared";
import { strategyVerificationQueue } from "@/lib/queues/strategy-verification";

type Context = { params: Promise<{ id: string }> };

const statusChange = z.object({ status: z.enum(["DRAFT", "PUBLISHED"]) });

const notFound = () => NextResponse.json({ success: false, message: "Strategy not found" }, { status: 404 });

export async function PUT(req: Request, { params }: Context) {
  try {
    const session = await getSession();
    if (!session.userId) return unauthorized();
    const strategistId = session.userId;
    const { id } = await params;

    const parsed = await readStrategy(req);
    if (parsed instanceof NextResponse) return parsed;

    // publishing and taking down have their own action, so a save keeps the current status
    const { status: _status, ...fields } = parsed.strategy;

    const saved = await db.transaction(async (tx) => {
      const updated = await tx.orm.public.Strategy.where({ id, strategistId }).update(fields);
      if (!updated) return false;
      await tx.orm.public.StrategyAcceptedAsset.where({ strategyId: id }).deleteAll();
      await tx.orm.public.StrategyAcceptedAsset.createAll(parsed.assets.map((asset) => ({ ...asset, strategyId: id })));
      return true;
    });

    // enque the strategy for verification if it was saved successfully
    if (saved) {
      const enqueueResult = await strategyVerificationQueue.add(
        "verify-strategy",
        {
          strategyId: id,
        },
        {
          jobId: `strategy-verification-${id}`,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      console.log(`Enqueued strategy verification job for strategy ${id} with job ID ${enqueueResult.id}`);
    }

    return saved ? NextResponse.json({ success: true }) : notFound();
  } catch (error) {
    return failure("update", error);
  }
}

export async function PATCH(req: Request, { params }: Context) {
  try {
    const session = await getSession();
    if (!session.userId) return unauthorized();
    const { id } = await params;

    const change = statusChange.safeParse(await req.json().catch(() => null));
    if (!change.success) {
      return NextResponse.json({ success: false, message: "Status must be DRAFT or PUBLISHED" }, { status: 400 });
    }

    const updated = await db.orm.public.Strategy.where({ id, strategistId: session.userId }).update({ status: change.data.status });
    return updated ? NextResponse.json({ success: true }) : notFound();
  } catch (error) {
    return failure("update", error);
  }
}

export async function DELETE(_req: Request, { params }: Context) {
  try {
    const session = await getSession();
    if (!session.userId) return unauthorized();
    const strategistId = session.userId;
    const { id } = await params;

    const deleted = await db.transaction(async (tx) => {
      const owned = await tx.orm.public.Strategy.where({ id, strategistId }).select("id").first();
      if (!owned) return false;
      await tx.orm.public.BacktestResult.where({ strategyId: id }).deleteAll();
      await tx.orm.public.StrategyAcceptedAsset.where({ strategyId: id }).deleteAll();
      await tx.orm.public.Strategy.where({ id, strategistId }).delete();
      return true;
    });

    return deleted ? NextResponse.json({ success: true }) : notFound();
  } catch (error) {
    return failure("delete", error);
  }
}
