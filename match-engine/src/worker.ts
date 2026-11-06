import { Worker } from "bullmq";
import { config } from "./config.js";
import { db } from "./db.js";
import { rankStrategies } from "./ranking.js";

export const worker = new Worker(
  // Todo: add the queue name
  "",
  async (job) => {
    const reqId = job.data.reqId;

    try {
      const req = await db.fetchReqById(reqId);
      if (!req) {
        throw new Error("Requirement not found!");
      }
      const eligibleStrategies = await db.fetchStrategies(req);
      const ranked = await rankStrategies(
        eligibleStrategies.map((strategy) => strategy.id),
      );

      const top3StrategyIds = ranked.map((strategy) => strategy.strategyId);

      console.log({
        recommendedStrategyId: top3StrategyIds[0] ?? null,
        top3StrategyIds,
      });
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
);
