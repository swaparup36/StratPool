export function calculateRSI(
  prices: number[],
  period: number = 14
): number[] {
  if (!Number.isInteger(period) || period < 1) {
    throw new Error("Invalid RSI period");
  }

  if (prices.length < period + 1) {
    throw new Error("Insufficient price data");
  }

  if (prices.some((p) => !Number.isFinite(p) || p <= 0)) {
    throw new Error("Invalid price data");
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];

    gains.push(Math.max(change, 0));
    losses.push(Math.max(-change, 0));
  }

  let avgGain =
    gains.slice(0, period).reduce((a, b) => a + b, 0) / period;

  let avgLoss =
    losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const results: number[] = [];

  function rsi(gain: number, loss: number): number {
    if (gain === 0 && loss === 0) return 50;
    if (loss === 0) return 100;
    if (gain === 0) return 0;

    const rs = gain / loss;
    return 100 - 100 / (1 + rs);
  }

  results.push(rsi(avgGain, avgLoss));

  for (let i = period; i < gains.length; i++) {
    avgGain =
      (avgGain * (period - 1) + gains[i]) / period;

    avgLoss =
      (avgLoss * (period - 1) + losses[i]) / period;

    results.push(rsi(avgGain, avgLoss));
  }

  return results;
}
