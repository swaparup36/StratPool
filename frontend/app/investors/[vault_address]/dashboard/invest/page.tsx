import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cache } from "react";
import { formatUnits } from "viem";
import { ConnectAgent } from "@/components/connect-agent";
import { PostRequirement } from "@/components/post-requirement";
import { RequirementPnl } from "@/components/requirement-pnl";
import { CHAINS, type Chain } from "@/components/strategy-builder/schema";
import { Tag } from "@/components/ui";
import { getInvestorVault } from "@/lib/investor";
import { hasAgentConnection } from "@/lib/mcp-tokens";
import { getSession } from "@/lib/session";
import { CHAIN_IDS, findToken } from "@/lib/tokens";
import { db } from "@/src/prisma/db";

export const metadata: Metadata = { title: "Invest" };

const statusLabels = { OPEN: "Open", MATCHED: "Matched", CLOSED: "Closed" };

// token decimal lookup is cached to avoid repeated calls to the token registry, which can be slow and rate-limited
const tokenDecimals = cache(async (chain: string, asset: string) => {
  const token = await findToken(CHAIN_IDS[chain as Chain], asset).catch(() => null);
  return token?.decimals ?? null;
});

async function RequirementAmount({ amount, asset, chain }: { amount: string; asset: string; chain: string }) {
  const decimals = await tokenDecimals(chain, asset);
  return decimals === null ? `${amount} wei of ${asset}` : `${formatUnits(BigInt(amount), decimals)} ${asset}`;
}

export default async function InvestPage({ params }: { params: Promise<{ vault_address: string }> }) {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");
  const { vault_address } = await params;
  const { chainId } = await getInvestorVault(vault_address);

  // Tokens can't be checked while Redis is down either, so no agent is connected at that point.
  const agentConnected = await hasAgentConnection(session.userId).catch(() => false);

  const requirements = await db.orm.public.InvestorRequirement.where({ investorId: session.userId })
    .orderBy((r) => r.createdAt.desc())
    .all();

  const assignments = await db.orm.public.strategyAssignment.where((a) => a.requirementId.in(requirements.map((r) => r.id)))
    .select("id", "requirementId", "deployedAt")
    .all();
  const deployed = assignments.filter((a) => a.deployedAt);
  const strategized = new Set(deployed.map((a) => a.requirementId));

  const trades = await db.orm.public.Trade.where((t) => t.assignmentId.in(deployed.map((a) => a.id)))
    .select("assignmentId", "chainId", "token", "cost", "proceeds", "commission")
    .all();
  const tradesOf = (requirementId: string) => {
    const ids = new Set(deployed.filter((a) => a.requirementId === requirementId).map((a) => a.id));
    return trades.filter((t) => ids.has(t.assignmentId));
  };

  return (
    <section className="grid gap-6 p-6 md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[24px] tracking-[-.02em]">My requirements</h1>
        <div className="flex flex-wrap gap-2">
          <ConnectAgent connected={agentConnected} />
          <PostRequirement defaultChain={CHAINS.find((chain) => CHAIN_IDS[chain] === chainId)} />
        </div>
      </div>

      {requirements.length === 0 ? (
        <p className="text-subtle">You haven&apos;t posted any requirements yet.</p>
      ) : (
        <ul className="grid gap-4">
          {requirements.map((requirement) => (
            <li className="grid min-w-0 gap-4 rounded-xl border bg-surface p-5" key={requirement.id}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="min-w-0 text-lg break-words">
                  <RequirementAmount amount={requirement.amount} asset={requirement.asset} chain={requirement.chain} />
                </h2>
                <Tag>{statusLabels[requirement.status]}</Tag>
                {strategized.has(requirement.id) && <Tag>Strategized</Tag>}
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

              {strategized.has(requirement.id) && <RequirementPnl trades={tradesOf(requirement.id)} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
