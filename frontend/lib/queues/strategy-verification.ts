import { Queue } from "bullmq";
import Redis from "ioredis";

const globalForQueue = globalThis as unknown as {
  strategyVerificationQueue: Queue | undefined;
};

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const strategyVerificationQueue =
  globalForQueue.strategyVerificationQueue ??
  new Queue("strategy-verification", { connection });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.strategyVerificationQueue = strategyVerificationQueue;
}