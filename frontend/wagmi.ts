import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import type { Hash } from 'viem';
import { http, type Config } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { mainnet, base, arbitrum, sepolia } from 'wagmi/chains';
import { RPC_URLS } from '@/lib/contracts';

export const config = getDefaultConfig({
  appName: 'StratPool',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [sepolia, mainnet, base, arbitrum],
  transports: {
    [sepolia.id]: http(RPC_URLS[sepolia.id]),
    [mainnet.id]: http(RPC_URLS[mainnet.id]),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
});

// Throws if the transaction reverted.
export const waitForTx = (hash: Hash, chainId: number) => waitForTransactionReceipt(config as Config, { hash, chainId });
