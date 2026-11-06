import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateVault } from "@/components/create-vault";
import { getInvestor } from "@/lib/investor";

export const metadata: Metadata = { title: "Create vault" };

export default async function CreateVaultPage() {
  const { address, vault } = await getInvestor();
  if (vault) redirect(`/investors/${vault}/dashboard`);

  return <CreateVault owner={address} />;
}
