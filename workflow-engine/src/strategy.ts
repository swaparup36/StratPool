import { randomUUID } from "node:crypto";
import pg from "pg";
import { z } from "zod";
import { env } from "./config.js";
import type { Address } from "viem";
import { DYNAMIC_FEE, graphSchema, poolVersion, unwrapped, v4KeyFee, type AcceptedAsset, type StrategyGraph } from "./schema.js";

const pool = new pg.Pool({ connectionString: env.DB_URI });

export type Strategy = { chain: string; tradingPair: string; poolId: string; version: 3 | 4; strategist: string; assets: AcceptedAsset[]; graph: StrategyGraph };

// The graph is read here rather than carried on the job, so it never sits in Redis
export async function loadStrategy(id: string): Promise<Strategy> {
  const { rows } = await pool.query(
    `SELECT s.chain, s."tradingType", s."tradingPair", s.protocol, s."poolAddress", s.graph, u.address AS strategist
     FROM "Strategy" s
     JOIN "User" u ON u.id = s."strategistId"
     WHERE s.id = $1 AND s.status = 'PUBLISHED' AND s."isVerified" = TRUE`,
    [id],
  );

  const row = rows[0];
  if (!row) throw new Error(`Strategy ${id} not found, not published or not verified`);
  if (row.tradingType !== "SPOT") throw new Error(`Unsupported trading type: ${row.tradingType}`);
  if (!String(row.protocol).includes("UNISWAP")) throw new Error(`Unsupported protocol: ${row.protocol}`);

  // The protocol is typed by the strategist and the pool decides how we trade, so they must agree
  const version = poolVersion(row.poolAddress);
  const named = /V([34])/.exec(row.protocol)?.[1];
  if (named && Number(named) !== version) throw new Error(`${row.protocol} doesn't match pool ${row.poolAddress}`);

  if (!/^0x[a-fA-F0-9]{40}$/.test(row.strategist)) throw new Error("Strategist has no valid address");

  const assets = await pool.query<AcceptedAsset>(
    `SELECT "chainId", "tokenAddress", symbol, decimals,
            "minInvestment"::text AS "minInvestment", "maxInvestment"::text AS "maxInvestment"
     FROM "StrategyAcceptedAsset"
     WHERE "strategyId" = $1`,
    [id],
  );

  return {
    chain: row.chain,
    tradingPair: row.tradingPair,
    poolId: row.poolAddress,
    version,
    strategist: row.strategist,
    assets: assets.rows,
    graph: graphSchema.parse(row.graph),
  };
}

export async function assign(requirementId: string, strategyId: string, chain: string) {
  const { rows } = await pool.query(
    `SELECT r.chain, u.address AS investor
     FROM "InvestorRequirement" r
     JOIN "User" u ON u.id = r."investorId"
     WHERE r.id = $1 AND r.status <> 'CLOSED'`,
    [requirementId],
  );

  const row = rows[0];
  if (!row) throw new Error(`Requirement ${requirementId} not found or closed`);
  if (row.chain !== chain) throw new Error(`Requirement is on ${row.chain}, but the strategy runs on ${chain}`);
  if (!/^0x[a-fA-F0-9]{40}$/.test(row.investor)) throw new Error("Investor has no valid address");

  const assignment = await pool.query<{ id: string }>(
    `INSERT INTO "strategyAssignment" (id, "strategyId", "requirementId") VALUES ($1, $2, $3)
     ON CONFLICT ("strategyId", "requirementId") DO UPDATE SET "strategyId" = EXCLUDED."strategyId"
     RETURNING id`,
    [randomUUID(), strategyId, requirementId],
  );

  return { assignmentId: assignment.rows[0]!.id, investor: row.investor as string };
}

export async function markDeployed(assignmentId: string) {
  await pool.query(
    `WITH deployed AS (UPDATE "strategyAssignment" SET "deployedAt" = now() WHERE id = $1 RETURNING "requirementId")
     UPDATE "InvestorRequirement" SET status = 'MATCHED', "updatedAt" = now() WHERE id IN (SELECT "requirementId" FROM deployed)`,
    [assignmentId],
  );
}

const tokenSchema = z.object({ id: z.string(), symbol: z.string(), decimals: z.coerce.number().int() });
const NO_ADDRESS = "0x0000000000000000000000000000000000000000";

// tickSpacing and hooks only exist on v4 pools, and only v4 swaps use them
const poolSchema = z.object({
  feeTier: z.coerce.number().int(),
  tickSpacing: z.coerce.number().int().default(0),
  hooks: z.string().default(NO_ADDRESS),
  token0: tokenSchema,
  token1: tokenSchema,
});

// Everything a swap needs that the strategy doesn't store: the pool's key, its decimals, and which side is the base
export async function resolvePool(subgraphUrl: string, version: 3 | 4, poolId: string, tradingPair: string, apiKey: string) {
  const response = await fetch(subgraphUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      query: `query ($id: ID!) {
        pool(id: $id) {
          feeTier ${version === 4 ? "tickSpacing hooks" : ""}
          token0 { id symbol decimals }
          token1 { id symbol decimals }
        }
      }`,
      variables: { id: poolId.toLowerCase() },
    }),
  });
  if (!response.ok) throw new Error(`Subgraph responded with HTTP ${response.status}`);

  const result = (await response.json()) as { data?: { pool?: unknown }; errors?: unknown[] };
  if (result.errors?.length) throw new Error(JSON.stringify(result.errors));
  if (!result.data?.pool) throw new Error(`Pool ${poolId} not found`);

  const { feeTier, tickSpacing, hooks, token0, token1 } = poolSchema.parse(result.data.pool);

  const [baseSymbol, quoteSymbol] = tradingPair.split("/").map(unwrapped);
  const symbol0 = unwrapped(token0.symbol);
  const symbol1 = unwrapped(token1.symbol);
  const baseIsToken0 = symbol0 === baseSymbol && symbol1 === quoteSymbol;
  if (!baseIsToken0 && !(symbol1 === baseSymbol && symbol0 === quoteSymbol)) {
    throw new Error(`Pool holds ${token0.symbol}/${token1.symbol}, not ${tradingPair}`);
  }

  const key = { currency0: token0.id as Address, currency1: token1.id as Address, fee: feeTier, tickSpacing, hooks: hooks as Address };
  const fee = version === 4 ? v4KeyFee(poolId, key) : feeTier;

  return {
    version,
    poolKey: { ...key, fee },
    base: baseIsToken0 ? token0.id : token1.id,
    quote: baseIsToken0 ? token1.id : token0.id,
    decimals0: token0.decimals,
    decimals1: token1.decimals,
    feeBps: fee === DYNAMIC_FEE ? 0 : Math.ceil(fee / 100),
    baseToken: baseIsToken0 ? token0 : token1,
    quoteToken: baseIsToken0 ? token1 : token0,
  };
}
