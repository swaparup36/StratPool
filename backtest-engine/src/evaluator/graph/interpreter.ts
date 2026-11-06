import type {
  StrategyGraph,
  IndicatorNode,
  ConditionNode,
  ActionNode,
} from "../../types.js";

import { parseStrategyGraph } from "./parser.js";
import { evaluateIndicator } from "./indicator-evaluator.js";
import { evaluateCondition } from "./condition-evaluator.js";

type TradingAction = "BUY" | "SELL" | "HOLD";

export type StrategySignal = {
  signalCandleIndex: number;
  executionCandleIndex: number;
  action: TradingAction;
  percentage: number;
};

export function interpretStrategy(
  graph: StrategyGraph,
  closingPrices: number[],
): StrategySignal[] {
  parseStrategyGraph(graph);

  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));

  const incoming = new Map<string, string[]>();

  for (const edge of graph.edges) {
    const sources = incoming.get(edge.target) ?? [];
    sources.push(edge.source);
    incoming.set(edge.target, sources);
  }

  const getParent = (id: string) => {
    const sources = incoming.get(id) ?? [];

    if (sources.length !== 1) {
      throw new Error(`Node ${id} requires one input`);
    }

    const parent = nodeMap.get(sources[0] as string);

    if (!parent) throw new Error("Missing parent node");

    return parent;
  };

  const indicators = new Map<string, Map<number, number>>();

  for (const node of graph.nodes) {
    if (node.type !== "indicator") continue;

    const indicator = node as IndicatorNode;

    const values = evaluateIndicator(indicator, closingPrices);

    const offset =
      indicator.data.indicator === "RSI"
        ? indicator.data.period
        : indicator.data.period - 1;

    const aligned = new Map<number, number>();

    values.forEach((value, index) => {
      aligned.set(offset + index, value);
    });

    indicators.set(node.id, aligned);
  }

  const signals: StrategySignal[] = [];

  // A signal on candle i executes on candle i + 1.
  for (let i = 1; i < closingPrices.length - 1; i++) {
    const matches: StrategySignal[] = [];

    for (const node of graph.nodes) {
      if (node.type !== "action") continue;

      const actionNode = node as ActionNode;
      const conditionNode = getParent(node.id);

      if (conditionNode.type !== "condition") {
        throw new Error("Action must follow a condition");
      }

      const indicatorNode = getParent(conditionNode.id);

      if (indicatorNode.type !== "indicator") {
        throw new Error("Condition must follow an indicator");
      }

      const values = indicators.get(indicatorNode.id)!;
      const previous = values.get(i - 1);
      const current = values.get(i);

      if (previous === undefined || current === undefined) {
        continue;
      }

      const matched = evaluateCondition(
        conditionNode as ConditionNode,
        previous,
        current,
      );

      if (!matched) continue;

      if (
        !Number.isFinite(actionNode.data.percentage) ||
        actionNode.data.percentage <= 0 ||
        actionNode.data.percentage > 100
      ) {
        throw new Error("Invalid action percentage");
      }

      matches.push({
        signalCandleIndex: i,
        executionCandleIndex: i + 1,
        action: actionNode.data.action,
        percentage: actionNode.data.percentage,
      });
    }

    const active = matches.filter((m) => m.action !== "HOLD");

    if (active.length > 1) {
      throw new Error(`Conflicting actions at candle ${i}`);
    }

    if (active.length === 1) {
      signals.push(active[0] as StrategySignal);
    }
  }

  return signals;
}
