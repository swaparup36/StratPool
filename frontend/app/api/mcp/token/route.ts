import { NextResponse } from "next/server";
import { failure, unauthorized } from "@/app/api/strategies/shared";
import { revokeAgentConnections } from "@/lib/mcp-tokens";
import { getSession } from "@/lib/session";

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session.userId) return unauthorized();

    await revokeAgentConnections(session.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return failure("revoke", error, "agent connections");
  }
}
