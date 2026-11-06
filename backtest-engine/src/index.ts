import { worker } from "./worker.js";

async function main() {
  worker.on("ready", () => {
    console.log("Backtesting engine running...");
  });
}

await main();
