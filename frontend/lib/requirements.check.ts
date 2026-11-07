import assert from "node:assert/strict";
import { z } from "zod";
import { requirementFields, requirementSchema } from "./requirements";

const valid = {
  amount: " 100.5 ",
  asset: " USDC ",
  chain: "SEPOLIA",
  tradingType: "SPOT",
  tradingPairs: [" eth/usdc ", "ETH/USDC", "wbtc/usdc"],
  riskLevel: "LOW",
  durationType: "FIXED",
  durationValue: 30,
  durationUnit: "DAYS",
};
const parse = (changes: object) => requirementSchema.safeParse({ ...valid, ...changes });
const rejects = (changes: object) => assert.equal(parse(changes).success, false, JSON.stringify(changes));

const ok = parse({});
assert.ok(ok.success);
assert.equal(ok.data.amount, "100.5");
assert.equal(ok.data.asset, "USDC");
assert.deepEqual(ok.data.tradingPairs, ["ETH/USDC", "WBTC/USDC"]);
assert.equal(ok.data.durationValue, 30);

const flexible = parse({ durationType: "FLEXIBLE", durationValue: 9, durationUnit: "MONTHS" });
assert.ok(flexible.success);
assert.equal(flexible.data.durationValue, null);
assert.equal(flexible.data.durationUnit, null);

for (const amount of ["0", "0.00", "-1", "abc", "1e3", ""]) rejects({ amount });
for (const asset of ["", "US DC"]) rejects({ asset });
rejects({ chain: "SOLANA" });
rejects({ riskLevel: "EXTREME" });
rejects({ tradingPairs: [] });
rejects({ tradingPairs: ["ETHUSDC"] });
rejects({ durationValue: null });
rejects({ durationUnit: null });
rejects({ durationValue: 0 });
rejects({ durationValue: 1.5 });
assert.equal(requirementSchema.safeParse(null).success, false);

// the MCP SDK parses with these fields before postRequirement parses again, so a second parse must not change the result
assert.deepEqual(requirementSchema.parse(z.object(requirementFields).parse(valid)), requirementSchema.parse(valid));

console.log("requirement checks passed");
