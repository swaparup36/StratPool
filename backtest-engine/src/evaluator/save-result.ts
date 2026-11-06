import { client } from "../config.js";
import type { SaveBacktestInput } from "../types.js";

export async function saveBacktestResult(
  result: SaveBacktestInput,
): Promise<string | void> {
  const { rows } = await client.query<{ id: string }>(
    `
    INSERT INTO "BacktestResult" (
      "id",
      "strategyId",
      "initialCapital",
      "finalEquity",
      "netReturnPct",
      "maxDrawdownPct",
      "totalTrades",
      "periodStart",
      "periodEnd",
      "createdAt"
    )
    VALUES (
      gen_random_uuid()::text,
      $1, $2, $3, $4, $5, $6, $7, $8, NOW()
    )
    RETURNING "id"
    `,
    [
      result.strategyId,
      result.initialCapital,
      result.finalEquity,
      result.netReturnPct,
      result.maxDrawdownPct,
      result.totalTrades,
      result.periodStart,
      result.periodEnd,
    ],
  );

  return rows[0]?.id;
}
