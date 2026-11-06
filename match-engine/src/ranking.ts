import { client } from "./config.js";
import type { RankedStrategy } from "./types.js";

export async function rankStrategies(
  strategyIds: string[],
): Promise<RankedStrategy[]> {
  if (strategyIds.length === 0) return [];

  const { rows } = await client.query<{
    strategyId: string;
    netReturnPct: string;
    maxDrawdownPct: string;
    totalTrades: number;
  }>(
    `
    SELECT DISTINCT ON ("strategyId")
      "strategyId",
      "netReturnPct",
      "maxDrawdownPct",
      "totalTrades"
    FROM "BacktestResult"
    WHERE "strategyId" = ANY($1::text[])
    ORDER BY "strategyId", "createdAt" DESC, "id" DESC
    `,
    [strategyIds],
  );

  return rows
    .filter(
      (row) =>
        Number.isFinite(Number(row.netReturnPct)) &&
        Number.isFinite(Number(row.maxDrawdownPct)) &&
        Number.isFinite(Number(row.totalTrades)),
    )
    .map((row) => {
      const netReturnPct = Number(row.netReturnPct);
      const maxDrawdownPct = Number(row.maxDrawdownPct);

      const score = netReturnPct - 0.5 * maxDrawdownPct;

      return {
        strategyId: row.strategyId,
        score,
        netReturnPct,
        maxDrawdownPct,
        totalTrades: Number(row.totalTrades),
      };
    })
    .sort(
      (a, b) => b.score - a.score || a.strategyId.localeCompare(b.strategyId),
    )
    .slice(0, 3);
}
