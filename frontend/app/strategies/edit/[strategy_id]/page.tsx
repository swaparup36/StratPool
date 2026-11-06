import type { Edge } from "@xyflow/react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { formatUnits } from "viem";
import type { MetadataForm, StrategyNode } from "@/components/strategy-builder/schema";
import { StrategyBuilder } from "@/components/strategy-builder/strategy-builder";
import { getSession } from "@/lib/session";
import { db } from "@/src/prisma/db";

export const metadata: Metadata = { title: "Edit strategy" };

export default async function EditStrategyPage({ params }: { params: Promise<{ strategy_id: string }> }) {
  const session = await getSession();
  if (!session.userId) redirect("/sign-in");
  const { strategy_id: id } = await params;

  const strategy = await db.orm.public.Strategy.where({ id, strategistId: session.userId })
    .select("id", "name", "description", "chain", "tradingType", "tradingPair", "protocol", "poolAddress", "riskLevel", "graph")
    .include("acceptedAssets", (assets) => assets.select("symbol", "decimals", "minInvestment", "maxInvestment"))
    .first();
  if (!strategy) notFound();

  const graph = strategy.graph as unknown as { nodes: StrategyNode[]; edges: Edge[] };

  return (
    <StrategyBuilder
      existing={{
        id: strategy.id,
        nodes: graph.nodes,
        edges: graph.edges,
        metadata: {
          name: strategy.name,
          description: strategy.description,
          chain: strategy.chain as MetadataForm["chain"],
          tradingType: strategy.tradingType,
          tradingPair: strategy.tradingPair,
          protocol: strategy.protocol,
          poolAddress: strategy.poolAddress ?? "",
          riskLevel: strategy.riskLevel,
          acceptedAssets: strategy.acceptedAssets.map((asset) => ({
            symbol: asset.symbol,
            minInvestment: formatUnits(BigInt(asset.minInvestment), asset.decimals),
            maxInvestment: asset.maxInvestment === null ? "" : formatUnits(BigInt(asset.maxInvestment), asset.decimals),
          })),
        },
      }}
    />
  );
}
