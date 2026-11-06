export function calculateMetrics(equityCurve: number[]) {
  if (
    equityCurve.length < 2 ||
    equityCurve.some((v) => !Number.isFinite(v) || v <= 0)
  ) {
    throw new Error("Invalid equity curve");
  }

  const initial = equityCurve[0] as any;
  const final = equityCurve[equityCurve.length - 1] as any;

  const netReturnPct = ((final - initial) / initial) * 100;

  let peak = initial;
  let maxDrawdown = 0;

  for (const equity of equityCurve) {
    peak = Math.max(peak, equity);

    const drawdown = ((peak - equity) / peak) * 100;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }

  return {
    netReturnPct,
    maxDrawdownPct: maxDrawdown,
  };
}
