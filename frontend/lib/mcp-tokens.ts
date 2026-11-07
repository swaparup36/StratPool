import { randomBytes } from "node:crypto";
import { sha256 } from "@/lib/oauth";
import redis from "@/lib/redis";

const CODE_TTL_SECONDS = 5 * 60;
const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

// Keys hold only hashes, so reading Redis doesn't reveal a usable code or token.
const codeKey = (code: string) => `mcp:code:${sha256(code)}`;
const tokenKey = (hash: string) => `mcp:token:${hash}`;
const investorKey = (investorId: string) => `mcp:investor:${investorId}`;

export type AuthorizationGrant = { investorId: string; clientId: string; redirectUri: string; codeChallenge: string };

export async function createAuthorizationCode(grant: AuthorizationGrant) {
  const code = randomBytes(32).toString("base64url");
  await redis.set(codeKey(code), JSON.stringify(grant), "EX", CODE_TTL_SECONDS);
  return code;
}

// GETDEL makes a code single-use even if two exchanges race.
export async function consumeAuthorizationCode(code: string) {
  const grant = await redis.getdel(codeKey(code));
  return grant ? (JSON.parse(grant) as AuthorizationGrant) : null;
}

export async function issueAccessToken(investorId: string) {
  const token = `stratpool_${randomBytes(32).toString("base64url")}`;
  const hash = sha256(token);
  await redis
    .multi()
    .set(tokenKey(hash), investorId, "EX", TOKEN_TTL_SECONDS)
    .sadd(investorKey(investorId), hash)
    .expire(investorKey(investorId), TOKEN_TTL_SECONDS)
    .exec();
  return { token, expiresIn: TOKEN_TTL_SECONDS };
}

export const investorForToken = (token: string) => redis.get(tokenKey(sha256(token)));

export async function hasAgentConnection(investorId: string) {
  const hashes = await redis.smembers(investorKey(investorId));
  return hashes.length > 0 && (await redis.exists(...hashes.map(tokenKey))) > 0;
}

export async function revokeAgentConnections(investorId: string) {
  const hashes = await redis.smembers(investorKey(investorId));
  await redis.del(investorKey(investorId), ...hashes.map(tokenKey));
}
