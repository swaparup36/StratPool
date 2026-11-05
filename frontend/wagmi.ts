import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, base, arbitrum, sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'StratPool',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [sepolia, mainnet, base, arbitrum],
});