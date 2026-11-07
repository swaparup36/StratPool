import { Worker } from "bullmq";
import { client, config } from "./config.js";
import { fetchUniswapCandles } from "./evaluator/providers/uniswap.js";
import { calculateMetrics } from "./evaluator/metrics.js";
import { runBacktest } from "./evaluator/backtest.js";
import { saveBacktestResult } from "./evaluator/save-result.js";
import { db } from "./db.js";

export const worker = new Worker(
  "strategy-verification",
  async (job) => {
    const strategyId = job.data.strategyId;
    console.log(strategyId);

    const strategy = await db.fetchStrategyById(strategyId);

    if (!strategy) {
      console.error("Strategy not found!");
      return;
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

    try {
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

      await db.markStrategyVerified(strategyId);

      console.log(
        `Job id: ${job.id} is processed with backtestId: ${backtestId}`,
      );

      return;
    } catch (error) {
      console.error(error);
      return;
    }
  },
  {
    connection: {
      url: config.redis_url,
    },
  },
).on("closing", async () => {
  await worker.close();
  await worker.disconnect();
  console.log("Redis disconnected...");
  return;
});
