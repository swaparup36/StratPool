import assert from "node:assert/strict";
import { formatNet, netByToken } from "./pnl";

const usdc = { chainId: 1, token: "0xusdc" };

const [profitThenLoss] = netByToken([
  { ...usdc, cost: "10000000", proceeds: "12000000", commission: "200000" },
  { ...usdc, cost: "10000000", proceeds: "8000000", commission: "0" },
]);
assert.equal(profitThenLoss!.net, BigInt(-200000), "commission counts against the investor");
assert.equal(profitThenLoss!.trades, 2);

// Large enough to lose precision as a number.
const [exact] = netByToken([{ ...usdc, cost: "0", proceeds: "123456789012345678901234567890", commission: "0" }]);
assert.equal(exact!.net, BigInt("123456789012345678901234567890"));

const separate = netByToken([
  { ...usdc, cost: "1", proceeds: "2", commission: "0" },
  { chainId: 1, token: "0xweth", cost: "1", proceeds: "2", commission: "0" },
  { chainId: 8453, token: "0xusdc", cost: "1", proceeds: "2", commission: "0" },
]);
assert.equal(separate.length, 3, "tokens and chains stay separate");

assert.deepEqual(netByToken([]), []);

assert.equal(formatNet(BigInt(1800000), 6), "+1.8");
assert.equal(formatNet(BigInt(-200000), 6), "-0.2");
assert.equal(formatNet(BigInt(0), 6), "0");

console.log("pnl checks passed");
