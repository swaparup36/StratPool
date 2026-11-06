"use client";

import { zeroAddress, type Address } from "viem";
import { useReadContract } from "wagmi";
import { VAULT_DEPLOYERS, vaultDeployerAbi } from "@/lib/contracts";

export function useChainVault(owner: Address, chainId: number | undefined) {
  const deployer = chainId ? VAULT_DEPLOYERS[chainId] : undefined;
  const { data } = useReadContract({
    address: deployer,
    abi: vaultDeployerAbi,
    functionName: "getVault",
    args: [owner],
    chainId,
    query: { enabled: !!deployer },
  });
  return { deployer, vault: data && data !== zeroAddress ? data : undefined };
}
