import { calculateRSI } from "../indicators/rsi.js";
import type { IndicatorNode } from "../../types.js";

export function evaluateIndicator(
  node: IndicatorNode,
  closingPrices: number[],
): number[] {
  const { indicator, period } = node.data;

  if (!Number.isInteger(period) || period < 1) {
    throw new Error("Invalid indicator period");
  }

  switch (indicator) {
    case "RSI":
      return calculateRSI(closingPrices, period);

    case "SMA":
      return calculateSMA(closingPrices, period);

    case "EMA":
      return calculateEMA(closingPrices, period);

    default:
      throw new Error(`Unsupported indicator: ${indicator}`);
  }
}

function calculateSMA(prices: number[], period: number): number[] {
  if (prices.length < period) {
    throw new Error("Insufficient price data");
  }

  const result: number[] = [];

  for (let i = period - 1; i < prices.length; i++) {
    const window = prices.slice(i - period + 1, i + 1);

    const average = window.reduce((sum, price) => sum + price, 0) / period;

    result.push(average);
  }

  return result;
}

function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length < period) {
    throw new Error("Insufficient price data");
  }

  const multiplier = 2 / (period + 1);
  const result: number[] = [];

  let previousEMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  result.push(previousEMA);

  for (let i = period; i < prices.length; i++) {
    previousEMA = (prices[i] as number - previousEMA) * multiplier + previousEMA;

    result.push(previousEMA);
  }

  return result;
}
