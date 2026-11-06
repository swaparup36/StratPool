import { Queue } from "bullmq";
import redis from "@/lib/redis";

const globalForQueue = globalThis as unknown as {
  strategyVerificationQueue: Queue | undefined;
};

export const strategyVerificationQueue =
  globalForQueue.strategyVerificationQueue ??
  new Queue("strategy-verification", { connection: redis });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.strategyVerificationQueue = strategyVerificationQueue;
}