import { createHash } from "node:crypto";
import { sealData, unsealData } from "iron-session";
import { z } from "zod";

// From config rather than the Host header, which a caller controls.
export const issuer = () => (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const mcpUrl = () => `${issuer()}/api/mcp`;

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export const verifyPkce = (verifier: string, challenge: string) =>
  /^[A-Za-z0-9._~-]{43,128}$/.test(verifier) && createHash("sha256").update(verifier).digest("base64url") === challenge;

export function isAllowedRedirectUri(uri: string) {
  if (!URL.canParse(uri)) return false;
  const { protocol, hostname, hash } = new URL(uri);
  if (hash) return false;
  return protocol === "https:" || (protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(hostname));
}

export function redirectWith(uri: string, params: Record<string, string | undefined>) {
  const url = new URL(uri);
  for (const [key, value] of Object.entries(params)) if (value !== undefined) url.searchParams.set(key, value);
  return url.toString();
}

const clientSchema = z.object({ name: z.string(), redirectUris: z.array(z.string()).min(1) });
type Client = z.infer<typeof clientSchema>;

// Separate from the session password, so a client_id can never be read as a session cookie or the reverse.
const clientPassword = () => sha256(`mcp-client:${process.env.SESSION_SECRET}`);

// The client_id is the sealed registration, so open registration stores nothing.
export const sealClient = (client: Client) => sealData(client, { password: clientPassword(), ttl: 0 });

export async function unsealClient(clientId: string) {
  const data = await unsealData(clientId, { password: clientPassword(), ttl: 0 }).catch(() => null);
  const client = clientSchema.safeParse(data);
  return client.success ? client.data : null;
}

// Names the agent and where its approval goes, so the wallet prompt shows what is being approved.
export const approvalStatement = (clientName: string, redirectUri: string) =>
  `Allow ${clientName} (${new URL(redirectUri).host}) to post investment requirements for my StratPool account. Matched requirements can trade my deposited funds.`;

const authorizeSchema = z.object({
  response_type: z.literal("code"),
  client_id: z.string().max(4096),
  redirect_uri: z.string(),
  code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  code_challenge_method: z.literal("S256"),
  state: z.string().max(2048).optional(),
  resource: z.string().optional(),
});

export async function parseAuthorizeRequest(input: unknown) {
  const parsed = authorizeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "This agent sent an invalid authorization request." } as const;
  const request = parsed.data;

  const client = await unsealClient(request.client_id);
  if (!client) return { ok: false, error: "This agent isn't registered." } as const;
  // Exact match: a failure here must never redirect, or the page becomes an open redirect.
  if (!client.redirectUris.includes(request.redirect_uri)) return { ok: false, error: "This agent's redirect URL isn't registered." } as const;
  if (request.resource !== undefined && request.resource.replace(/\/$/, "") !== mcpUrl()) {
    return { ok: false, error: "This agent asked for access to a different server." } as const;
  }

  return { ok: true, client, request } as const;
}
