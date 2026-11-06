import { redirect } from "next/navigation";
import { zeroAddress, type Address } from "viem";
import { sepolia } from "viem/chains";
import { VAULT_DEPLOYER_ADDRESS, vaultDeployerAbi } from "@/lib/contracts";
import { getSession } from "@/lib/session";
import { clients } from "@/lib/viem";
import { db } from "@/src/prisma/db";

// Uses the wallet linked to the session, so it works before the browser wallet reconnects.
export async function getInvestor() {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");

  const user = await db.orm.public.User.where({ id: session.userId }).select("address").first();
  if (!user) redirect("/sign-in");

  const address = user.address as Address;
  const vault = await clients[sepolia.id].readContract({
    address: VAULT_DEPLOYER_ADDRESS,
    abi: vaultDeployerAbi,
    functionName: "getVault",
    args: [address],
  });

  return { address, vault: vault === zeroAddress ? null : vault };
}
