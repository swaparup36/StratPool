import { redirect } from "next/navigation";
import { cache } from "react";
import { zeroAddress, type Address } from "viem";
import { VAULT_DEPLOYERS, vaultDeployerAbi } from "@/lib/contracts";
import { getSession } from "@/lib/session";
import { clients } from "@/lib/viem";
import { db } from "@/src/prisma/db";

// Uses the wallet linked to the session, so it works before the browser wallet reconnects.
export const getInvestor = cache(async () => {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");

  const user = await db.orm.public.User.where({ id: session.userId }).select("address").first();
  if (!user) redirect("/sign-in");

  const address = user.address as Address;
  const found = await Promise.all(
    Object.entries(VAULT_DEPLOYERS).map(async ([id, deployer]) => {
      const chainId = Number(id);
      const vault = await clients[chainId].readContract({
        address: deployer!,
        abi: vaultDeployerAbi,
        functionName: "getVault",
        args: [address],
      });
      return { chainId, vault };
    })
  );

  return { address, vaults: found.filter(({ vault }) => vault !== zeroAddress) };
});

// A dashboard is only for the investor's own vault, and this also tells us which chain it's on.
export async function getInvestorVault(vaultAddress: string) {
  const { address, vaults } = await getInvestor();
  const match = vaults.find(({ vault }) => vault.toLowerCase() === vaultAddress.toLowerCase());
  if (!match) redirect("/investors");
  return { owner: address, ...match };
}
