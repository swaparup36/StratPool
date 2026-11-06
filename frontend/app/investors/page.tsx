import { redirect } from "next/navigation";
import { getInvestor } from "@/lib/investor";

export default async function InvestorsPage() {
  const { vault } = await getInvestor();
  redirect(vault ? `/investors/${vault}/dashboard` : "/investors/create-vault");
}
