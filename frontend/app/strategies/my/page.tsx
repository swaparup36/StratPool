import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatUnits } from "viem";
import { StrategyActions } from "@/components/strategy-actions";
import { buttonClass, Tag } from "@/components/ui";
import { getSession } from "@/lib/session";
import { db } from "@/src/prisma/db";

export const metadata: Metadata = { title: "My strategies" };

export default async function MyStrategiesPage() {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");

  const strategies = await db.orm.public.Strategy.where({ strategistId: session.userId })
    .select("id", "name", "description", "chain", "tradingType", "tradingPair", "protocol", "riskLevel", "status")
    .include("acceptedAssets", (assets) => assets.select("id", "symbol", "decimals", "minInvestment", "maxInvestment"))
    .orderBy((s) => s.updatedAt.desc())
    .all();

  return (
    <section className="grid gap-6 p-6 md:p-10">
      <h1 className="text-[24px] tracking-[-.02em]">My strategies</h1>

      {strategies.length === 0 ? (
        <div className="grid justify-items-start gap-3">
          <p className="text-subtle">You haven&apos;t created any strategies yet.</p>
          <Link className={buttonClass()} href="/strategies/create">
            Create a strategy
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4">
          {strategies.map((strategy) => (
            <li className="grid min-w-0 gap-4 rounded-xl border bg-surface p-5" key={strategy.id}>
              <div className="grid min-w-0 gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="min-w-0 text-lg break-words">{strategy.name}</h2>
                  <Tag>{strategy.status === "PUBLISHED" ? "Published" : "Draft"}</Tag>
                </div>
                <p className="text-sm break-words text-muted">{strategy.description}</p>
              </div>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-5">
                {[
                  ["Chain", strategy.chain],
                  ["Type", strategy.tradingType],
                  ["Pair", strategy.tradingPair],
                  ["Protocol", strategy.protocol],
                  ["Risk", strategy.riskLevel],
                ].map(([label, value]) => (
                  <div className="min-w-0" key={label}>
                    <dt className="text-xs text-subtle">{label}</dt>
                    <dd className="break-words">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="text-sm">
                <h3 className="text-xs text-subtle">Accepted assets</h3>
                <ul className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
                  {strategy.acceptedAssets.map((asset) => (
                    <li key={asset.id}>
                      {asset.symbol}: min {formatUnits(BigInt(asset.minInvestment), asset.decimals)}
                      {asset.maxInvestment !== null && `, max ${formatUnits(BigInt(asset.maxInvestment), asset.decimals)}`}
                    </li>
                  ))}
                </ul>
              </div>

              <StrategyActions id={strategy.id} name={strategy.name} status={strategy.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
