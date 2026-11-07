import { NextResponse } from "next/server";
import { failure, rejected, unauthorized } from "@/app/api/strategies/shared";
import { postRequirement } from "@/lib/post-requirement";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.userId) return unauthorized();

    const result = await postRequirement(session.userId, await req.json().catch(() => null));
    if (!result.ok) return rejected([...result.errors]);

    return NextResponse.json({ success: true, data: result.requirement }, { status: 201 });
  } catch (error) {
    return failure("create", error, "requirement");
  }
}
