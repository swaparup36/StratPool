import type { Metadata } from "next";
import { CreateVault } from "@/components/create-vault";
import { getInvestor } from "@/lib/investor";

export const metadata: Metadata = { title: "Create vault" };

export default async function CreateVaultPage() {
  const { address } = await getInvestor();
  return <CreateVault owner={address} />;
}
