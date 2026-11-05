import type { CreateStrategyPayload } from "@/components/strategy-builder/schema";

export async function createStrategy(payload: CreateStrategyPayload) {
  const response = await fetch("/api/strategies/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Failed to create strategy");
  }

  return response.json();
}
