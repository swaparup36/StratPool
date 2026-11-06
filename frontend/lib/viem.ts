import { createPublicClient, http, type PublicClient } from 'viem';
import { mainnet, base, arbitrum, sepolia } from 'viem/chains';
import { SEPOLIA_RPC_URL } from '@/lib/contracts';

export const clients = Object.fromEntries(
  [sepolia, mainnet, base, arbitrum].map((chain) => [
    chain.id,
    createPublicClient({ chain, transport: http(process.env[`RPC_URL_${chain.id}`] ?? (chain.id === sepolia.id ? SEPOLIA_RPC_URL : undefined)) }),
  ])
) as Record<number, PublicClient>;
