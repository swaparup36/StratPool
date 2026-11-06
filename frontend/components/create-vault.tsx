"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isAddressEqual, parseEventLogs, type Address, type BaseError } from "viem";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { sepolia } from "wagmi/chains";
import { AuthCard } from "@/components/forms";
import { VAULT_DEPLOYER_ADDRESS, vaultDeployerAbi } from "@/lib/contracts";
import { config } from "@/wagmi";

export function CreateVault({ owner }: { owner: Address }) {
  const router = useRouter();
  const { address, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    if (!address) {
      openConnectModal?.();
      return;
    }
    // the contract gives the vault to msg.sender, so it must be the wallet on this account
    if (!isAddressEqual(address, owner)) {
      setError(`Switch your wallet to ${owner}, the one linked to your account`);
      return;
    }

    try {
      if (chainId !== sepolia.id) await switchChainAsync({ chainId: sepolia.id });
      const hash = await writeContractAsync({
        address: VAULT_DEPLOYER_ADDRESS,
        abi: vaultDeployerAbi,
        functionName: "createVault",
        chainId: sepolia.id,
      });
      // throws if the transaction reverted, so the event is always there
      const { logs } = await waitForTransactionReceipt(config, { hash, chainId: sepolia.id });
      const [created] = parseEventLogs({ abi: vaultDeployerAbi, logs, eventName: "VaultCreated" });
      router.replace(`/investors/${created.args.vault}/dashboard`);
    } catch (e) {
      setError((e as BaseError).shortMessage ?? "Could not create your vault, please try again");
    }
  }

  return (
    <AuthCard title="Create your vault" submit={address ? "Create vault" : "Connect wallet"} onSubmit={create} error={error}>
      <p className="border-b px-8 py-4 text-center text-sm text-muted">
        Your vault holds your deposits and belongs only to your wallet. Creating it takes one transaction on Sepolia.
      </p>
    </AuthCard>
  );
}
