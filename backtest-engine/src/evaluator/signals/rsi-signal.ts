import type { TradingSignal } from "../../types.js";

export function generateRSISignal(
  previousRSI: number,
  currentRSI: number,
  buyThreshold = 30,
  sellThreshold = 70,
): TradingSignal {
  if (
    !Number.isFinite(previousRSI) ||
    !Number.isFinite(currentRSI) ||
    buyThreshold < 0 ||
    sellThreshold > 100 ||
    buyThreshold >= sellThreshold
  ) {
    throw new Error("Invalid RSI values or thresholds");
  }

  if (previousRSI >= buyThreshold && currentRSI < buyThreshold) {
    return "BUY";
  }

  if (previousRSI <= sellThreshold && currentRSI > sellThreshold) {
    return "SELL";
  }

  return "HOLD";
}
