import { NextResponse } from "next/server";
import { z } from "zod";
import { isAllowedRedirectUri, sealClient } from "@/lib/oauth";

const registration = z.object({
  client_name: z.string().optional(),
  redirect_uris: z.array(z.string().refine(isAllowedRedirectUri)).min(1).max(10),
});

export async function POST(req: Request) {
  const parsed = registration.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_redirect_uri", error_description: "redirect_uris must be https, or http on localhost" }, { status: 400 });
  }

  // The name is shown on the approval page and in the wallet prompt, so keep it to one plain line.
  const name = parsed.data.client_name?.replace(/[^\w .-]/g, "").trim().slice(0, 60) || "An AI agent";
  const client_id = await sealClient({ name, redirectUris: parsed.data.redirect_uris });

  return NextResponse.json(
    {
      client_id,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: name,
      redirect_uris: parsed.data.redirect_uris,
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201 }
  );
}
