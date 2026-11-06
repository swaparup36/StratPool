import "dotenv/config";
import { envSchema } from "./schema.js";

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Error parsing env file!");
  throw new Error(parsed.error.message);
}

export const env = parsed.data;

const CHAINS = {
  ETHEREUM: { name: "ethereum-mainnet", id: 1 },
  BASE: { name: "ethereum-mainnet-base-1", id: 8453 },
  ARBITRUM: { name: "ethereum-mainnet-arbitrum-1", id: 42161 },
  SEPOLIA: { name: "ethereum-testnet-sepolia", id: 11155111 },
} as const;

// Uniswap v3 and v4 subgraph IDs for each chain
const SUBGRAPH_IDS: Record<string, Partial<Record<3 | 4, string>>> = {
  ETHEREUM: { 3: "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV", 4: "EzLH76FWsZUSBTfp2P6CV7cqN56e1rSt2uWtqtsUMEeb" },
  BASE: { 3: "43Hwfi3dJSoGpyas9VwNoDAv55yjgGrPpNSmbQZArzMG", 4: "Gqm2b5J85n1bhCyDMpGbtbVn4935EvvdyHdHrx3dibyj" },
  ARBITRUM: { 3: "FbCGRftH4a3yZugY7TnbYgPJVEv2LvMT6oF1fxPe9aJM", 4: "D1VHPU6cXXSC8eaApWCjCnPcTZQFSYCpGoDAvt4ogDWh" },
  SEPOLIA: { 3: "EDJCBpDBGBajTP1x3qLGLg3ZaVR5Q2TkNxyNHdCuryex" },
};

export function indexedChains() {
  return Object.entries(CHAINS).flatMap(([chain, { id }]) => {
    const commissionManager = process.env[`COMMISSION_MANAGER_${chain}`];
    if (!commissionManager) return [];

    const rpcUrl = process.env[`RPC_URL_${chain}`];
    const startBlock = process.env[`INDEXER_START_BLOCK_${chain}`];
    if (!rpcUrl || !startBlock) throw new Error(`Set RPC_URL_${chain} and INDEXER_START_BLOCK_${chain} to index ${chain}`);

    return [{ id, rpcUrl, commissionManager: commissionManager as `0x${string}`, startBlock: BigInt(startBlock) }];
  });
}

// Settings for the chain a strategy runs on. Checked per job so the engine only needs the chains in use
export function chainConfig(chain: string, version: 3 | 4) {
  if (!(chain in CHAINS)) throw new Error(`Unsupported chain: ${chain}`);

  const subgraphId = SUBGRAPH_IDS[chain]?.[version];
  if (!subgraphId) throw new Error(`No Uniswap v${version} subgraph for ${chain}`);

  const read =(name: string) => {
    const value = process.env[`${name}_${chain}`];
    if (!value) throw new Error(`Missing env ${name}_${chain}`);
    return value;
  };

  const commissionManager = read("COMMISSION_MANAGER");
  if (!/^0x[a-fA-F0-9]{40}$/.test(commissionManager)) throw new Error(`Invalid COMMISSION_MANAGER_${chain}`);

  return {
    ...CHAINS[chain as keyof typeof CHAINS],
    rpcEnvName: `RPC_URL_${chain}`,
    rpcUrl: read("RPC_URL"),
    subgraphUrl: `https://gateway.thegraph.com/api/subgraphs/id/${subgraphId}`,
    commissionManager,
  };
}
