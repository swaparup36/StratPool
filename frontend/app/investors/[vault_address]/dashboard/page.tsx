import type { Metadata } from "next";
import { VaultPanel } from "@/components/vault-panel";
import { getInvestorVault } from "@/lib/investor";

export const metadata: Metadata = { title: "Vault" };

export default async function VaultPage({ params }: { params: Promise<{ vault_address: string }> }) {
  const { vault_address } = await params;
  const { owner, chainId, vault } = await getInvestorVault(vault_address);

  return <VaultPanel owner={owner} vault={vault} chainId={chainId} />;
}
