import { NextResponse } from "next/server";
import { validateStrategy } from "@/components/strategy-builder/schema";
import { resolveAssets, TokenLookupError } from "@/lib/tokens";

export const rejected = (errors: string[]) => NextResponse.json({ success: false, message: errors.join(". "), errors }, { status: 400 });

export const unauthorized = () => NextResponse.json({ success: false, message: "User is not logged in" }, { status: 401 });

export async function readStrategy(req: Request) {
  const body = await req.json().catch(() => null);
  const nodes = Array.isArray(body?.graph?.nodes) ? body.graph.nodes : [];
  const edges = Array.isArray(body?.graph?.edges) ? body.graph.edges : [];

  const result = validateStrategy(body, nodes, edges);
  if (!result.ok) return rejected(result.errors);

  const { acceptedAssets, ...strategy } = result.payload;
  const tokens = await resolveAssets(strategy.chain, acceptedAssets);
  if (!tokens.ok) return rejected(tokens.errors);

  return { strategy, assets: tokens.assets };
}

export function failure(action: string, error: unknown, subject = "strategy") {
  console.error(`Failed to ${action} ${subject}`, error);
  if (error instanceof TokenLookupError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 503 });
  }
  return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
}
