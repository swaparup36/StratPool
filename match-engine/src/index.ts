import { worker } from "./worker.js";

async function main() {
  worker.on("ready", () => {
    console.log("Strategy matching engine running...");
  });
}

await main();
