import { parseUnits } from "viem";
import { z } from "zod";
import type { Chain, CreateStrategyPayload } from "@/components/strategy-builder/schema";

export const CHAIN_IDS: Record<Chain, number> = { ETHEREUM: 1, BASE: 8453, SEPOLIA: 11155111 };

const TOKEN_API = "https://li.quest/v1/token";

const tokenResponse = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  chainId: z.number(),
  symbol: z.string(),
  decimals: z.number().int().min(0).max(36),
});

export class TokenLookupError extends Error {}

export async function findToken(chainId: number, symbol: string) {
  const unavailable = (cause: unknown) => new TokenLookupError("Couldn't verify token symbols right now. Please try again.", { cause });

  let response: Response;
  try {
    response = await fetch(`${TOKEN_API}?chain=${chainId}&token=${encodeURIComponent(symbol)}`, { signal: AbortSignal.timeout(8000) });
  } catch (cause) {
    throw unavailable(cause);
  }

  if (response.status === 400 || response.status === 404) return null;
  if (!response.ok) throw unavailable(`Token API responded with ${response.status}`);

  const token = tokenResponse.safeParse(await response.json().catch(() => null));
  if (!token.success) throw unavailable(token.error);

  const matches = token.data.symbol.toLowerCase() === symbol.toLowerCase() && token.data.chainId === chainId;
  return matches ? token.data : null;
}

export async function resolveAssets(chain: Chain, assets: CreateStrategyPayload["acceptedAssets"]) {
  const chainId = CHAIN_IDS[chain];
  const tokens = await Promise.all(assets.map(({ symbol }) => findToken(chainId, symbol)));

  const errors: string[] = [];
  const resolved = [];

  for (const [index, { symbol, minInvestment, maxInvestment }] of assets.entries()) {
    const found = tokens[index];
    if (!found) {
      errors.push(`No token with symbol ${symbol} exists on ${chain}`);
      continue;
    }
    const toWei = (amount: string) => {
      if ((amount.split(".")[1]?.length ?? 0) > found.decimals) {
        errors.push(`${found.symbol} supports at most ${found.decimals} decimal places, so ${amount} is too precise`);
        return "0";
      }
      return parseUnits(amount, found.decimals).toString();
    };
    resolved.push({
      chainId,
      tokenAddress: found.address,
      symbol: found.symbol,
      decimals: found.decimals,
      minInvestment: toWei(minInvestment),
      maxInvestment: maxInvestment === null ? null : toWei(maxInvestment),
    });
  }

  return errors.length ? ({ ok: false, errors } as const) : ({ ok: true, assets: resolved } as const);
}
