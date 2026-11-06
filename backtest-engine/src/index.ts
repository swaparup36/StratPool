import { worker } from "./worker.js";

async function main() {
  worker.on("ready", () => {
    console.log("Worker running...");
  });
}

await main();
