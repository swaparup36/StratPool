import { redirect } from "next/navigation";
import { getInvestor } from "@/lib/investor";

export default async function InvestorsPage({ searchParams }: { searchParams: Promise<{ chain?: string }> }) {
  const { chain } = await searchParams;
  const { vaults } = await getInvestor();
  // Prefer the vault on the wallet's selected chain.
  const match = vaults.find(({ chainId }) => chainId === Number(chain)) ?? vaults[0];
  redirect(match ? `/investors/${match.vault}/dashboard` : "/investors/create-vault");
}
