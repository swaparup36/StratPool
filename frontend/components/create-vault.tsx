"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAddressEqual, parseEventLogs, type Address, type BaseError } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { AuthCard } from "@/components/forms";
import { useChainVault } from "@/hooks/use-chain-vault";
import { vaultDeployerAbi } from "@/lib/contracts";
import { waitForTx } from "@/wagmi";

export function CreateVault({ owner }: { owner: Address }) {
  const router = useRouter();
  const { address, chain } = useAccount();
  const { deployer, vault } = useChainVault(owner, chain?.id);
  const { openConnectModal } = useConnectModal();
  const { writeContractAsync } = useWriteContract();
  const [error, setError] = useState<string | null>(null);

  // already has a vault on the selected chain
  useEffect(() => {
    if (vault) router.replace(`/investors/${vault}/dashboard`);
  }, [vault, router]);

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
    if (!chain || !deployer) {
      setError("Pick a network where StratPool is available");
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: deployer,
        abi: vaultDeployerAbi,
        functionName: "createVault",
        chainId: chain.id,
      });
      // a reverted transaction throws here, so the event is always there
      const { logs } = await waitForTx(hash, chain.id);
      const [created] = parseEventLogs({ abi: vaultDeployerAbi, logs, eventName: "VaultCreated" });
      router.replace(`/investors/${created.args.vault}/dashboard`);
    } catch (e) {
      setError((e as BaseError).shortMessage ?? "Could not create your vault, please try again");
    }
  }

  const network = !address
    ? "Connect your wallet and pick a network in the navbar."
    : !chain
      ? "Your wallet is on an unsupported network. Pick another in the navbar."
      : deployer
        ? `Creating it takes one transaction on ${chain.name}.`
        : `StratPool isn't available on ${chain.name} yet. Pick another network in the navbar.`;

  return (
    <AuthCard title="Create your vault" submit={address ? "Create vault" : "Connect wallet"} onSubmit={create} error={error}>
      <p className="border-b px-8 py-4 text-center text-sm text-muted">
        Your vault holds your deposits and belongs only to your wallet. {network}
      </p>
    </AuthCard>
  );
}
