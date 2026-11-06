import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { getInvestor } from "@/lib/investor";

export default async function InvestorDashboardLayout({
  params,
  children,
}: {
  params: Promise<{ vault_address: string }>;
  children: ReactNode;
}) {
  const { vault_address } = await params;
  const { vault } = await getInvestor();
  // A dashboard is only for the vault's own investor.
  if (vault?.toLowerCase() !== vault_address.toLowerCase()) redirect("/investors");

  const dashboard = `/investors/${vault_address}/dashboard`;
  return (
    <div className="flex min-h-[calc(100svh-65px)] max-md:flex-col">
      <Sidebar
        label="Investor dashboard"
        links={[
          { href: dashboard, label: "Vault", icon: "lock" },
          { href: `${dashboard}/invest`, label: "Invest", icon: "target" },
        ]}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
