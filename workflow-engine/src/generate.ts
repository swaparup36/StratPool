import type { StrategyGraph, StrategyNode, Timeframe } from "./schema.js";

const TIMEFRAME_SECONDS: Record<Timeframe, number> = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400 };

const SCHEDULES: Record<Timeframe, string> = {
  "1m": "0 * * * * *",
  "5m": "0 */5 * * * *",
  "15m": "0 */15 * * * *",
  "1h": "0 0 * * * *",
  "4h": "0 0 */4 * * *",
  "1d": "0 0 0 * * *",
};

const MAX_CANDLES_PER_TIMEFRAME = 1000;
const MAX_CANDLES = 1500;

// Same ordering and cycle check as the backtest engine's parseStrategyGraph
function topologicalOrder({ nodes, edges }: StrategyGraph): StrategyNode[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (byId.size !== nodes.length) throw new Error("Duplicate node IDs");

  const inDegree = new Map(nodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    if (!byId.has(edge.source) || !byId.has(edge.target)) throw new Error(`Invalid edge: ${edge.id}`);
    inDegree.set(edge.target, inDegree.get(edge.target)! + 1);
  }

  const queue = nodes.filter((node) => inDegree.get(node.id) === 0).map((node) => node.id);
  const ordered: StrategyNode[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    ordered.push(byId.get(id)!);
    for (const edge of edges) {
      if (edge.source !== id) continue;
      const degree = inDegree.get(edge.target)! - 1;
      inDegree.set(edge.target, degree);
      if (degree === 0) queue.push(edge.target);
    }
  }

  if (ordered.length !== nodes.length) throw new Error("Cycle detected in strategy graph");
  return ordered;
}

// EMA and RSI smooth over their whole history, so they get extra candles to settle; SMA only needs its window.
function candlesFor(indicator: "RSI" | "SMA" | "EMA", period: number) {
  return indicator === "SMA" ? period + 1 : Math.min(3 * period + 2, MAX_CANDLES_PER_TIMEFRAME);
}

// emit a TypeScript file that implements the strategy graph as a function that takes closes and returns signals
export function generateStrategy(graph: StrategyGraph): string {
  const ordered = topologicalOrder(graph);

  const triggers = new Set(ordered.flatMap((node) => (node.type === "trigger" ? [node.data.timeframe] : [])));
  if (triggers.size !== 1) throw new Error(`A workflow needs exactly one trigger timeframe, found ${triggers.size}`);
  const [trigger] = triggers as Set<Timeframe>;

  const variable = new Map(ordered.map((node, index) => [node.id, `n${index}`]));
  const inputs = (id: string) => graph.edges.filter((edge) => edge.target === id);
  const sourceVar = (id: string) => variable.get(id)!;

  const lookback: Partial<Record<Timeframe, number>> = {};
  const lines: string[] = [];
  const actions: string[] = [];

  for (const node of ordered) {
    const name = sourceVar(node.id);

    switch (node.type) {
      case "trigger":
        break;

      case "indicator": {
        const { indicator, period, timeframe } = node.data;
        lookback[timeframe] = Math.max(lookback[timeframe] ?? 0, candlesFor(indicator, period));
        lines.push(`const ${name} = ${indicator.toLowerCase()}(closes[${JSON.stringify(timeframe)}], ${period})`);
        break;
      }

      case "condition": {
        const { operator, referenceType, value } = node.data;
        const incoming = inputs(node.id);
        const a = incoming.filter((edge) => (edge.targetHandle ?? "input") === "input");
        const b = incoming.filter((edge) => edge.targetHandle === "compare");
        if (a.length !== 1) throw new Error(`Condition ${node.id} needs one input A`);

        let reference: string;
        if (referenceType === "VALUE") {
          if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Condition ${node.id} needs a value`);
          reference = String(value);
        } else {
          if (b.length !== 1) throw new Error(`Condition ${node.id} needs one input B`);
          reference = sourceVar(b[0]!.source);
        }

        lines.push(`const ${name} = compare(${JSON.stringify(operator)}, ${sourceVar(a[0]!.source)}, ${reference})`);
        break;
      }

      case "logic": {
        const incoming = inputs(node.id);
        if (incoming.length < 2) throw new Error(`Logic block ${node.id} needs at least two inputs`);
        const joiner = node.data.operator === "AND" ? " && " : " || ";
        lines.push(`const ${name} = ${incoming.map((edge) => sourceVar(edge.source)).join(joiner)}`);
        break;
      }

      case "action": {
        const incoming = inputs(node.id);
        if (incoming.length !== 1) throw new Error(`Action ${node.id} needs one input`);
        const { action, percentage } = node.data;
        if (action === "HOLD") break;
        if (typeof percentage !== "number") throw new Error(`Action ${node.id} needs a percentage`);
        actions.push(`{ action: ${JSON.stringify(action)}, percentage: ${percentage}, matched: ${sourceVar(incoming[0]!.source)} }`);
        break;
      }
    }
  }

  if (!actions.length) throw new Error("Strategy has no BUY or SELL action");

  const total = Object.values(lookback).reduce((sum, count) => sum + count, 0);
  if (total > MAX_CANDLES) throw new Error(`Strategy needs ${total} candles, more than the ${MAX_CANDLES} a workflow can fetch`);

  const timeframes = Object.entries(lookback).map(([timeframe, candles]) => ({
    timeframe,
    seconds: TIMEFRAME_SECONDS[timeframe as Timeframe],
    candles,
  }));

  return `// Generated by workflow-engine. Do not edit.
import { compare, ema, rsi, sma, type Closes, type Signal } from "./lib"

export const SCHEDULE = ${JSON.stringify(SCHEDULES[trigger!])}

export const TIMEFRAMES = ${JSON.stringify(timeframes)}

export const decide = (closes: Closes): Signal[] => {
${lines.map((line) => `  ${line}`).join("\n")}
  const signals: Signal[] = [
${actions.map((action) => `    ${action},`).join("\n")}
  ]
  return signals.filter((signal) => signal.matched)
}
`;
}
