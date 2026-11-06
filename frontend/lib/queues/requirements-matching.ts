import { Queue } from "bullmq";
import redis from "@/lib/redis";

const globalForQueue = globalThis as unknown as {
  requirementsMatchingQueue: Queue | undefined;
};

export const requirementsMatchingQueue =
  globalForQueue.requirementsMatchingQueue ??
  new Queue("requirements-matching", { connection: redis });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.requirementsMatchingQueue = requirementsMatchingQueue;
}