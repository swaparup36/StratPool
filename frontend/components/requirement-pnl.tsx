import { cache } from "react";
import { erc20Abi, zeroAddress, type Address } from "viem";
import { formatNet, netByToken } from "@/lib/pnl";
import { clients } from "@/lib/viem";

// One lookup per token per render. Trades store only the token's address.
const tokenInfo = cache(async (chainId: number, token: string) => {
  if (token === zeroAddress) return { symbol: "ETH", decimals: 18 };

  const erc20 = { address: token as Address, abi: erc20Abi } as const;
  try {
    const [symbol, decimals] = await Promise.all([
      clients[chainId].readContract({ ...erc20, functionName: "symbol" }),
      clients[chainId].readContract({ ...erc20, functionName: "decimals" }),
    ]);
    return { symbol, decimals };
  } catch {
    return null;
  }
});

export async function RequirementPnl({ trades }: { trades: Parameters<typeof netByToken>[0] }) {
  const rows = await Promise.all(
    netByToken(trades).map(async (row) => {
      const info = await tokenInfo(row.chainId, row.token);
      return {
        ...row,
        label: info ? `${formatNet(row.net, info.decimals)} ${info.symbol}` : `${row.net} base units of ${row.token}`,
      };
    }),
  );

  return (
    <dl className="grid gap-1 border-t pt-4 text-sm">
      <dt className="text-xs text-subtle">Realized P&amp;L, after commission</dt>
      {rows.length === 0 ? (
        <dd className="text-subtle">No closed trades yet</dd>
      ) : (
        rows.map(({ chainId, token, net, trades: count, label }) => (
          <dd className="break-words" key={`${chainId}:${token}`}>
            <span className={net > BigInt(0) ? "text-green-600" : net < BigInt(0) ? "text-red-500" : undefined}>{label}</span>
            <span className="text-subtle"> · {count === 1 ? "1 closed trade" : `${count} closed trades`}</span>
          </dd>
        ))
      )}
    </dl>
  );
}
