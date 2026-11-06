import { encodeAbiParameters, keccak256, type Address } from "viem";
import { z } from "zod";

// v3 pool's address is 20 bytes, while a v4 pool's ID is 32 bytes
export function poolVersion(pool: string | null | undefined): 3 | 4 {
  if (/^0x[a-fA-F0-9]{40}$/.test(pool ?? "")) return 3;
  if (/^0x[a-fA-F0-9]{64}$/.test(pool ?? "")) return 4;
  throw new Error("Strategy needs a Uniswap v3 pool address or v4 pool ID");
}

// A dynamic-fee pool's key holds this flag instead of a fee.
export const DYNAMIC_FEE = 0x800000;

type V4Key = { currency0: Address; currency1: Address; fee: number; tickSpacing: number; hooks: Address };

export const v4PoolId = ({ currency0, currency1, fee, tickSpacing, hooks }: V4Key) =>
  keccak256(
    encodeAbiParameters(
      [{ type: "address" }, { type: "address" }, { type: "uint24" }, { type: "int24" }, { type: "address" }],
      [currency0, currency1, fee, tickSpacing, hooks],
    ),
  );

// A v4 pool's fee is part of its key, so the subgraph's pool ID can be used to look up the fee
export function v4KeyFee(poolId: string, key: V4Key) {
  const fee = [key.fee, DYNAMIC_FEE].find((candidate) => v4PoolId({ ...key, fee: candidate }) === poolId.toLowerCase());
  if (fee === undefined) throw new Error(`The subgraph's pool key doesn't hash to pool ${poolId}`);
  return fee;
}

// Considering WETH and ETH are the same market to a strategist typing ETH/USDC.
export const unwrapped = (symbol: string) => symbol.toUpperCase().replace(/^W(?=ETH$|BTC$)/, "");

export type AcceptedAsset = {
  chainId: number;
  tokenAddress: string;
  symbol: string;
  decimals: number;
  minInvestment: string;
  maxInvestment: string | null;
};
export type TradeLimit = { min: string; max: string | null };

// validate a strategy before generating code for it
export function limitFor(assets: AcceptedAsset[], chainId: number, token: { id: string; symbol: string; decimals: number }): TradeLimit | null {
  const onChain = assets.filter((asset) => asset.chainId === chainId);
  const asset =
    onChain.find((candidate) => candidate.tokenAddress.toLowerCase() === token.id.toLowerCase()) ??
    onChain.find((candidate) => unwrapped(candidate.symbol) === unwrapped(token.symbol));
  if (!asset) return null;

  // The strategy's asset must match the pool's token, or the strategy could trade more than it has
  if (asset.decimals !== token.decimals) {
    throw new Error(`${asset.symbol} has ${asset.decimals} decimals, but the pool's ${token.symbol} has ${token.decimals}`);
  }
  return { min: asset.minInvestment, max: asset.maxInvestment };
}

export const envSchema = z.object({
  DB_URI: z.url(),
  REDIS_URL: z.url(),
  CRE_API_KEY: z.string().min(1).optional(),
  CRE_ETH_PRIVATE_KEY: z.string().regex(/^[a-fA-F0-9]{64}$/, "Must be 64 hex characters, without 0x").optional(),
  CRE_SESSION_DIR: z.string().optional(),
  CRE_DEPLOYMENT_REGISTRY: z.string().default("onchain:ethereum-mainnet"),
  CRE_THE_GRAPH_API_KEY: z.string().min(1),
  SANDBOX_IMAGE: z.string().default("stratpool-cre-sandbox"),
  SLIPPAGE_BPS: z.coerce.number().int().min(1).max(1000).default(100),
});

export const jobSchema = z.object({
  requirement_id: z.uuid(),
  strategyId: z.uuid(),
});

// an UUID fits in a bytes32, so a trade's on-chain tag converts back to its assignment without a lookup table
export const toOnchainId = (id: string) => `0x${id.replaceAll("-", "").padStart(64, "0")}` as const;

export function fromOnchainId(tag: string) {
  const hex = tag.slice(-32);
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
}

export type WorkflowJob = z.infer<typeof jobSchema>;

const timeframe = z.enum(["1m", "5m", "15m", "1h", "4h", "1d"]);
export type Timeframe = z.infer<typeof timeframe>;

// Mirrors the strategy builder's schema. Every value that reaches generated code is an enum or a finite number
export const graphSchema = z.object({
  nodes: z.array(
    z.discriminatedUnion("type", [
      z.object({ id: z.string(), type: z.literal("trigger"), data: z.object({ timeframe }) }),
      z.object({
        id: z.string(),
        type: z.literal("indicator"),
        data: z.object({
          indicator: z.enum(["RSI", "SMA", "EMA"]),
          period: z.number().int().min(1).max(500),
          timeframe,
        }),
      }),
      z.object({
        id: z.string(),
        type: z.literal("condition"),
        data: z.object({
          operator: z.enum(["GREATER_THAN", "LESS_THAN", "CROSS_ABOVE", "CROSS_BELOW"]),
          referenceType: z.enum(["VALUE", "INDICATOR"]),
          value: z.number().nullable().optional(),
        }),
      }),
      z.object({ id: z.string(), type: z.literal("logic"), data: z.object({ operator: z.enum(["AND", "OR"]) }) }),
      z.object({
        id: z.string(),
        type: z.literal("action"),
        data: z.object({ action: z.enum(["BUY", "SELL", "HOLD"]), percentage: z.number().gt(0).max(100).nullable().optional() }),
      }),
    ]),
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      targetHandle: z.enum(["input", "compare"]).optional(),
    }),
  ),
});

export type StrategyGraph = z.infer<typeof graphSchema>;
export type StrategyNode = StrategyGraph["nodes"][number];
