import { NextResponse } from "next/server";
import { issuer } from "@/lib/oauth";

export const GET = () =>
  NextResponse.json({
    issuer: issuer(),
    authorization_endpoint: `${issuer()}/oauth/authorize`,
    token_endpoint: `${issuer()}/api/oauth/token`,
    registration_endpoint: `${issuer()}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  });
