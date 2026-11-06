import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PostRequirement } from "@/components/post-requirement";
import { CHAINS } from "@/components/strategy-builder/schema";
import { Tag } from "@/components/ui";
import { getInvestorVault } from "@/lib/investor";
import { getSession } from "@/lib/session";
import { CHAIN_IDS } from "@/lib/tokens";
import { db } from "@/src/prisma/db";

export const metadata: Metadata = { title: "Invest" };

const statusLabels = { OPEN: "Open", MATCHED: "Matched", CLOSED: "Closed" };

export default async function InvestPage({ params }: { params: Promise<{ vault_address: string }> }) {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");
  const { vault_address } = await params;
  const { chainId } = await getInvestorVault(vault_address);

  const requirements = await db.orm.public.InvestorRequirement.where({ investorId: session.userId })
    .orderBy((r) => r.createdAt.desc())
    .all();

  return (
    <section className="grid gap-6 p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[24px] tracking-[-.02em]">My requirements</h1>
        <PostRequirement defaultChain={CHAINS.find((chain) => CHAIN_IDS[chain] === chainId)} />
      </div>

      {requirements.length === 0 ? (
        <p className="text-subtle">You haven&apos;t posted any requirements yet.</p>
      ) : (
        <ul className="grid gap-4">
          {requirements.map((requirement) => (
            <li className="grid min-w-0 gap-4 rounded-xl border bg-surface p-5" key={requirement.id}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="min-w-0 text-lg break-words">
                  {requirement.amount} {requirement.asset}
                </h2>
                <Tag>{statusLabels[requirement.status]}</Tag>
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Chain", requirement.chain],
                  ["Type", requirement.tradingType],
                  ["Pairs", requirement.tradingPairs.join(", ")],
                  ["Risk", requirement.riskLevel],
                  ["Duration", requirement.durationType === "FIXED" ? `${requirement.durationValue} ${requirement.durationUnit}` : "FLEXIBLE"],
                  ["Posted", new Date(requirement.createdAt).toLocaleDateString("en", { dateStyle: "medium" })],
                ].map(([label, value]) => (
                  <div className="min-w-0" key={label}>
                    <dt className="text-xs text-subtle">{label}</dt>
                    <dd className="break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
