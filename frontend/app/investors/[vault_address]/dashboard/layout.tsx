import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { VaultNetworkGuard } from "@/components/vault-network-guard";
import { getInvestorVault } from "@/lib/investor";

export default async function InvestorDashboardLayout({
  params,
  children,
}: {
  params: Promise<{ vault_address: string }>;
  children: ReactNode;
}) {
  const { vault_address } = await params;
  const { owner, chainId } = await getInvestorVault(vault_address);

  const dashboard = `/investors/${vault_address}/dashboard`;
  return (
    <div className="flex min-h-[calc(100svh-73px)] max-md:flex-col">
      <Sidebar
        label="Investor dashboard"
        links={[
          { href: dashboard, label: "Vault", icon: "lock" },
          { href: `${dashboard}/invest`, label: "Invest", icon: "target" },
        ]}
      />
      <div className="min-w-0 flex-1">
        <VaultNetworkGuard owner={owner} vaultChainId={chainId}>
          {children}
        </VaultNetworkGuard>
      </div>
    </div>
  );
}
