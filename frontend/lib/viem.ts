import { createPublicClient, http, type PublicClient } from 'viem';
import { mainnet, base, arbitrum, sepolia } from 'viem/chains';

export const clients = Object.fromEntries(
  [sepolia, mainnet, base, arbitrum].map((chain) => [
    chain.id,
    createPublicClient({ chain, transport: http(process.env[`RPC_URL_${chain.id}`]) }),
  ])
) as Record<number, PublicClient>;
