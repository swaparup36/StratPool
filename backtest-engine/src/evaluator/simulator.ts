import type { TradingSignal, Portfolio } from "../types.js";

export function simulateTrade(
  portfolio: Portfolio,
  signal: TradingSignal,
  ethPrice: number,
  feeBps = 30,
  percentage = 100,
): Portfolio {
  if (!Number.isFinite(ethPrice) || ethPrice <= 0) {
    throw new Error("Invalid ETH price");
  }

  if (!Number.isFinite(feeBps) || feeBps < 0 || feeBps >= 10000) {
    throw new Error("Invalid fee");
  }

  if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
    throw new Error("Invalid allocation percentage");
  }

  const next: Portfolio = {
    usdc: portfolio.usdc,
    eth: portfolio.eth,
    trades: [...portfolio.trades],
  };

  const feeRate = feeBps / 10000;
  const allocation = percentage / 100;

  if (signal === "BUY" && next.usdc > 0) {
    const amount = next.usdc * allocation;
    const fee = amount * feeRate;
    const quantity = (amount - fee) / ethPrice;

    next.usdc -= amount;
    next.eth += quantity;

    next.trades.push({
      type: "BUY",
      price: ethPrice,
      quantity,
      fee,
    });
  }

  if (signal === "SELL" && next.eth > 0) {
    const quantity = next.eth * allocation;
    const gross = quantity * ethPrice;
    const fee = gross * feeRate;

    next.eth -= quantity;
    next.usdc += gross - fee;

    next.trades.push({
      type: "SELL",
      price: ethPrice,
      quantity,
      fee,
    });
  }

  return next;
}
