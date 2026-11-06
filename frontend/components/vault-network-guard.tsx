"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Address } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { useChainVault } from "@/hooks/use-chain-vault";
import { config } from "@/wagmi";
import { buttonClass } from "./ui";

// a vault lives on one chain, so the dashboard follows the chain picked in the navbar
export function VaultNetworkGuard({
  owner,
  vaultChainId,
  children,
}: {
  owner: Address;
  vaultChainId: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const { chainId, chain } = useAccount();
  const { deployer, vault } = useChainVault(owner, chainId);
  const { switchChain } = useSwitchChain();
  const onVaultChain = !chainId || chainId === vaultChainId;

  useEffect(() => {
    if (!onVaultChain && vault) router.replace(`/investors/${vault}/dashboard`);
  }, [onVaultChain, vault, router]);

  if (onVaultChain) return children;
  if (vault) return null;

  const home = config.chains.find(({ id }) => id === vaultChainId);
  return (
    <section className="grid justify-items-start gap-3 p-6 md:p-10">
      <h1 className="text-[24px] tracking-[-.02em]">{deployer ? `No vault on ${chain?.name}` : "Network not available"}</h1>
      <p className="text-subtle">
        {deployer
          ? `You don't have a vault on ${chain?.name} yet. Create one, or go back to your ${home?.name} vault.`
          : `StratPool isn't available on ${chain?.name ?? "this network"} yet. Your vault is on ${home?.name}.`}
      </p>
      <div className="flex flex-wrap gap-2">
        {deployer && (
          <Link className={buttonClass()} href="/investors/create-vault">
            Create a vault
          </Link>
        )}
        <button
          className={buttonClass(deployer ? "secondary" : "primary")}
          type="button"
          onClick={() => switchChain({ chainId: vaultChainId })}
        >
          Switch to {home?.name}
        </button>
      </div>
    </section>
  );
}
