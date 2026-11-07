import { NextResponse } from "next/server";
import { consumeAuthorizationCode, issueAccessToken } from "@/lib/mcp-tokens";
import { verifyPkce } from "@/lib/oauth";

const NO_STORE = { "Cache-Control": "no-store" };
const oauthError = (error: string) => NextResponse.json({ error }, { status: 400, headers: NO_STORE });

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const field = (name: string) => {
    const value = form?.get(name);
    return typeof value === "string" ? value : null;
  };

  if (field("grant_type") !== "authorization_code") return oauthError("unsupported_grant_type");
  const code = field("code");
  const verifier = field("code_verifier");
  if (!code || !verifier) return oauthError("invalid_request");

  const grant = await consumeAuthorizationCode(code);
  if (!grant || grant.clientId !== field("client_id") || grant.redirectUri !== field("redirect_uri") || !verifyPkce(verifier, grant.codeChallenge)) {
    return oauthError("invalid_grant");
  }

  const { token, expiresIn } = await issueAccessToken(grant.investorId);
  return NextResponse.json({ access_token: token, token_type: "Bearer", expires_in: expiresIn }, { headers: NO_STORE });
}
