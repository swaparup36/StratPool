import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, base, arbitrum, sepolia } from 'wagmi/chains';
import { SEPOLIA_RPC_URL } from '@/lib/contracts';

export const config = getDefaultConfig({
  appName: 'StratPool',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [sepolia, mainnet, base, arbitrum],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC_URL),
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
});
