import { Queue } from "bullmq";
import { config } from "./config.js";

export const queue = new Queue("workflow-queue", {
  connection: {
    url: config.redis_url,
  },
});
