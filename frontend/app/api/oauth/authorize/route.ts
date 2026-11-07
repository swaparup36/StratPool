import { NextResponse } from "next/server";
import { parseSiweMessage } from "viem/siwe";
import { failure, rejected, unauthorized } from "@/app/api/strategies/shared";
import { createAuthorizationCode } from "@/lib/mcp-tokens";
import { approvalStatement, parseAuthorizeRequest, redirectWith } from "@/lib/oauth";
import { getSession } from "@/lib/session";
import { isAppDomain, wrongDomainError } from "@/lib/siwe";
import { clients } from "@/lib/viem";
import { db } from "@/src/prisma/db";

// turns the investor's wallet signature into an authorization code for the agent
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session.userId) return unauthorized();

    const { message, signature, params } = (await req.json().catch(() => null)) ?? {};
    if (typeof message !== "string" || typeof signature !== "string") return rejected(["Invalid request"]);

    const nonce = session.nonce;
    if (!nonce) return rejected(["Your approval expired, please try again"]);
    // Nonce is single-use, whatever happens next
    session.nonce = undefined;
    await session.save();

    const authorize = await parseAuthorizeRequest(params);
    if (!authorize.ok) return rejected([authorize.error]);
    const { client, request } = authorize;

    const siwe = parseSiweMessage(message);
    const chainClient = siwe.chainId ? clients[siwe.chainId] : undefined;
    if (!chainClient) return rejected(["Switch your wallet to Ethereum, Base or Sepolia, then try again"]);
    if (!isAppDomain(siwe.domain)) return rejected([wrongDomainError()]);
    if (siwe.statement !== approvalStatement(client.name, request.redirect_uri)) return rejected(["The signed approval doesn't match this agent"]);

    const user = await db.orm.public.User.where({ id: session.userId }).select("address").first();
    if (!user || siwe.address?.toLowerCase() !== user.address) return rejected(["Connect the wallet linked to this account"]);

    const valid = await chainClient.verifySiweMessage({
      message,
      signature: signature as `0x${string}`,
      nonce,
      domain: siwe.domain,
    });
    if (!valid) return rejected(["Invalid signature"]);

    const code = await createAuthorizationCode({
      investorId: session.userId,
      clientId: request.client_id,
      redirectUri: request.redirect_uri,
      codeChallenge: request.code_challenge,
    });

    return NextResponse.json({ success: true, data: { redirectTo: redirectWith(request.redirect_uri, { code, state: request.state }) } });
  } catch (error) {
    return failure("approve", error, "agent connection");
  }
}
