import { client } from "./config.js";
import type { StrategyGraph } from "./types.js";
import { fetchUniswapCandles } from "./evaluator/providers/uniswap.js";
import { runBacktest } from "./evaluator/backtest.js";
import { calculateMetrics } from "./evaluator/metrics.js";
import { saveBacktestResult } from "./evaluator/save-result.js";

async function main() {
  const strategyId = process.env.TEST_STRATEGY_ID;
  console.log(strategyId);

  if (!strategyId) {
    throw new Error("Missing TEST_STRATEGY_ID");
  }

  const result = await client.query<{
    id: string;
    name: string;
    chain: string;
    protocol: string;
    poolAddress: string;
    graph: StrategyGraph;
  }>(
    `SELECT id, name, chain, protocol,
            "poolAddress", graph
     FROM "Strategy"
     WHERE id = $1`,
    [strategyId],
  );

  const strategy = result.rows[0];
  console.log(strategy);

  if (!strategy) {
    throw new Error("Strategy not found");
  }

  if (!["UNISWAP_V3", "UNISWAP_V4"].includes(strategy.protocol)) {
    throw new Error(`Unsupported protocol: ${strategy.protocol}`);
  }

  const endpointKey = `${strategy.protocol}_${strategy.chain}_URL`;
  const endpoint = process.env[endpointKey];

  if (!endpoint) {
    throw new Error(`Missing environment variable: ${endpointKey}`);
  }

  const to = Math.floor(Date.now() / 1000);
  const from = to - 2 * 24 * 60 * 60;

  const candles = await fetchUniswapCandles(
    endpoint,
    strategy.poolAddress,
    from,
    to,
  );

  const backtestResult = runBacktest(strategy.graph, candles, 1000);

  const metrics = calculateMetrics(backtestResult.equityCurve);

  const backtestId = await saveBacktestResult({
    strategyId: strategy.id,
    initialCapital: 1000,
    finalEquity: backtestResult.equityCurve.at(-1)!,
    netReturnPct: metrics.netReturnPct,
    maxDrawdownPct: metrics.maxDrawdownPct,
    totalTrades: backtestResult.portfolio.trades.length,
    periodStart: new Date(from * 1000),
    periodEnd: new Date(to * 1000),
  });

  console.log("Saved backtest:", backtestId);
}

main()
  .catch(console.error)
  .finally(() => client.end());
