import { parseUnits } from "viem";

// Returns the amount in base units, or an error message. parseUnits alone would silently round excess decimals.
export function parseAmount(input: string, decimals: number, max: bigint, overMax: string): bigint | string {
  const text = input.trim();
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) return "Enter a valid amount";
  if ((text.split(".")[1]?.length ?? 0) > decimals) return `This token supports at most ${decimals} decimal places`;

  const amount = parseUnits(text, decimals);
  if (amount === 0n) return "Enter an amount above zero";
  if (amount > max) return overMax;
  return amount;
}
