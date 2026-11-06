import assert from "node:assert/strict";
import { parseAmount } from "./amount";

const max = 2_500_000n; // 2.5 of a 6-decimal token

assert.equal(parseAmount("1.5", 6, max, "over"), 1_500_000n);
assert.equal(parseAmount(" 2.5 ", 6, max, "over"), max);
assert.equal(parseAmount(".5", 6, max, "over"), 500_000n);
assert.equal(parseAmount("1.", 6, max, "over"), 1_000_000n);
assert.equal(parseAmount("2.500001", 6, max, "over"), "over");
assert.match(parseAmount("0.0000001", 6, max, "over") as string, /at most 6 decimal/);
for (const bad of ["", ".", "abc", "-1", "1e3", "1,5", "1.2.3", "0x10"]) {
  assert.equal(parseAmount(bad, 6, max, "over"), "Enter a valid amount", bad);
}
assert.match(parseAmount("0", 6, max, "over") as string, /above zero/);
assert.match(parseAmount("0.000", 6, max, "over") as string, /above zero/);

console.log("amount checks passed");
