import { formatUnits } from "viem";

type Trade = { chainId: number; token: string; cost: string; proceeds: string; commission: string };

// Different tokens can't be added together without a price, so the investor's net result is kept per token.
export function netByToken(trades: Trade[]) {
  const totals = new Map<string, { chainId: number; token: string; net: bigint; trades: number }>();
  for (const { chainId, token, cost, proceeds, commission } of trades) {
    const key = `${chainId}:${token}`;
    const total = totals.get(key) ?? { chainId, token, net: BigInt(0), trades: 0 };
    total.net += BigInt(proceeds) - BigInt(cost) - BigInt(commission);
    total.trades += 1;
    totals.set(key, total);
  }
  return [...totals.values()];
}

export const formatNet = (net: bigint, decimals: number) => `${net > BigInt(0) ? "+" : ""}${formatUnits(net, decimals)}`;
