import type { CreateStrategyPayload, SaveStatus } from "@/components/strategy-builder/schema";

async function send(url: string, method: string, fallback: string, payload?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || fallback);
  }

  return response.json();
}

export const createStrategy = (payload: CreateStrategyPayload) => send("/api/strategies/", "POST", "Failed to create strategy", payload);

export const updateStrategy = (id: string, payload: CreateStrategyPayload) => send(`/api/strategies/${id}`, "PUT", "Failed to save strategy", payload);

export const setStrategyStatus = (id: string, status: SaveStatus) => send(`/api/strategies/${id}`, "PATCH", "Failed to update strategy", { status });

export const deleteStrategy = (id: string) => send(`/api/strategies/${id}`, "DELETE", "Failed to delete strategy");
