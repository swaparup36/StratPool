import type { StrategyGraph, Candle, BacktestResult } from "../types.js";
import { interpretStrategy } from "./graph/interpreter.js";
import { simulateTrade, type Portfolio } from "./simulator.js";

export function runBacktest(
  graph: StrategyGraph,
  candles: Candle[],
  initialCapital = 1000,
): BacktestResult {
  if (!Number.isFinite(initialCapital) || initialCapital <= 0) {
    throw new Error("Invalid initial capital");
  }

  if (
    candles.length < 2 ||
    candles.some(
      (c) =>
        !Number.isFinite(c.open) ||
        !Number.isFinite(c.close) ||
        c.open <= 0 ||
        c.close <= 0,
    )
  ) {
    throw new Error("Invalid candle data");
  }

  const closingPrices = candles.map((c) => c.close);
  const signals = interpretStrategy(graph, closingPrices);

  const signalsByCandle = new Map(
    signals.map((signal) => [signal.executionCandleIndex, signal]),
  );

  let portfolio: Portfolio = {
    usdc: initialCapital,
    eth: 0,
    trades: [],
  };

  const equityCurve: number[] = [initialCapital];

  for (let i = 0; i < candles.length; i++) {
    const signal = signalsByCandle.get(i);

    if (signal) {
      portfolio = simulateTrade(
        portfolio,
        signal.action,
        candles[i].open,
        30,
        signal.percentage,
      );
    }

    const equity = portfolio.usdc + portfolio.eth * candles[i].close;

    equityCurve.push(equity);
  }

  return { portfolio, equityCurve };
}
