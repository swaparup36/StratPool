import { NextResponse } from "next/server";
import { issuer, mcpUrl } from "@/lib/oauth";

export const GET = () => NextResponse.json({ resource: mcpUrl(), authorization_servers: [issuer()], bearer_methods_supported: ["header"] });
