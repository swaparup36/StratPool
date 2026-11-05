import { NextResponse } from "next/server";
import { validateStrategy } from "@/components/strategy-builder/schema";
import { getSession } from "@/lib/session";
import { resolveAssets, TokenLookupError } from "@/lib/tokens";
import { db } from "@/src/prisma/db";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.userId) {
      return NextResponse.json({ success: false, message: "User is not logged in" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const nodes = Array.isArray(body?.graph?.nodes) ? body.graph.nodes : [];
    const edges = Array.isArray(body?.graph?.edges) ? body.graph.edges : [];

    const result = validateStrategy(body, nodes, edges);
    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.errors.join(". "), errors: result.errors }, { status: 400 });
    }

    const { acceptedAssets, ...strategy } = result.payload;
    const tokens = await resolveAssets(strategy.chain, acceptedAssets);
    if (!tokens.ok) {
      return NextResponse.json({ success: false, message: tokens.errors.join(". "), errors: tokens.errors }, { status: 400 });
    }

    const created = await db.orm.public.Strategy.create({
      ...strategy,
      strategistId: session.userId,
      // Nested, so a failed asset can't leave a strategy behind without its assets.
      acceptedAssets: (assets) => assets.create(tokens.assets),
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Failed to create strategy", error);
    if (error instanceof TokenLookupError) {
      return NextResponse.json({ success: false, message: error.message }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
