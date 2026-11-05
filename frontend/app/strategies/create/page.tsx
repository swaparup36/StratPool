import type { Metadata } from "next";
import { StrategyBuilder } from "@/components/strategy-builder/strategy-builder";

export const metadata: Metadata = { title: "Create strategy" };

export default function CreateStrategyPage() {
  return <StrategyBuilder />;
}
