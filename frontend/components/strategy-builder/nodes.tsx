import { Handle, Position, useUpdateNodeInternals, type NodeProps } from "@xyflow/react";
import { Activity, Clock, Merge, Split, Zap, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import type { ActionNode, ConditionNode, IndicatorNode, LogicNode, NodeType, StrategyNode, TriggerNode } from "./schema";

export const NODE_META: Record<NodeType, { label: string; icon: LucideIcon }> = {
  trigger: { label: "Trigger", icon: Clock },
  indicator: { label: "Indicator", icon: Activity },
  condition: { label: "Condition", icon: Split },
  logic: { label: "Logic", icon: Merge },
  action: { label: "Action", icon: Zap },
};

type Template = StrategyNode extends infer N ? (N extends StrategyNode ? Pick<N, "type" | "data"> : never) : never;
export type LibraryItem = { key: string; label: string; template: Template };

const indicator = (name: "RSI" | "SMA" | "EMA", period: number): LibraryItem => ({
  key: name.toLowerCase(),
  label: name,
  template: { type: "indicator", data: { indicator: name, period, timeframe: "1h" } },
});
const action = (name: "BUY" | "SELL" | "HOLD", label: string): LibraryItem => ({
  key: name.toLowerCase(),
  label,
  template: { type: "action", data: { action: name, percentage: name === "HOLD" ? null : 100 } },
});

export const LIBRARY: { category: string; items: LibraryItem[] }[] = [
  { category: "Triggers", items: [{ key: "trigger", label: "Timeframe", template: { type: "trigger", data: { timeframe: "1h" } } }] },
  { category: "Indicators", items: [indicator("RSI", 14), indicator("SMA", 20), indicator("EMA", 20)] },
  {
    category: "Conditions",
    items: [
      {
        key: "condition",
        label: "Compare",
        template: { type: "condition", data: { operator: "LESS_THAN", referenceType: "VALUE", value: 30 } },
      },
    ],
  },
  {
    category: "Logic",
    items: [
      { key: "and", label: "AND", template: { type: "logic", data: { operator: "AND" } } },
      { key: "or", label: "OR", template: { type: "logic", data: { operator: "OR" } } },
    ],
  },
  { category: "Actions", items: [action("BUY", "Buy"), action("SELL", "Sell"), action("HOLD", "Hold")] },
];

const inputLabel = "pointer-events-none absolute left-2 -translate-y-1/2 text-[10px] leading-none text-subtle";

function NodeCard({ type, selected, text, twoInputs }: { type: NodeType; selected?: boolean; text: string; twoInputs?: boolean }) {
  const { label, icon: NodeIcon } = NODE_META[type];
  return (
    <div
      className={`relative w-44 rounded-xl border bg-surface py-2.5 pr-3 text-fg ${twoInputs ? "pl-6" : "pl-3"} ${selected ? "border-accent ring-1 ring-accent" : ""}`}
    >
      {twoInputs ? (
        <>
          <Handle className="size-3!" style={{ top: "30%" }} id="input" type="target" position={Position.Left} />
          <span className={`${inputLabel} top-[30%]`}>A</span>
          <Handle className="size-3!" style={{ top: "70%" }} id="compare" type="target" position={Position.Left} />
          <span className={`${inputLabel} top-[70%]`}>B</span>
        </>
      ) : (
        type !== "trigger" && <Handle className="size-3!" id="input" type="target" position={Position.Left} />
      )}
      <div className="flex items-center gap-1.5 text-xs text-subtle">
        <NodeIcon className="size-3.5" aria-hidden />
        {label}
      </div>
      <p className="mt-0.5 text-sm break-words">{text}</p>
      {type !== "action" && <Handle className="size-3!" id="output" type="source" position={Position.Right} />}
    </div>
  );
}

const OPERATOR_TEXT = { GREATER_THAN: ">", LESS_THAN: "<", CROSS_ABOVE: "crosses above", CROSS_BELOW: "crosses below" };

function ConditionCard({ id, data, selected }: NodeProps<ConditionNode>) {
  const twoInputs = data.referenceType === "INDICATOR";
  const updateNodeInternals = useUpdateNodeInternals();
  // React Flow has to re-measure when a node's handles change, or edges can't attach to the new one.
  useEffect(() => updateNodeInternals(id), [id, twoInputs, updateNodeInternals]);

  const operator = OPERATOR_TEXT[data.operator];
  return (
    <NodeCard type="condition" selected={selected} twoInputs={twoInputs} text={twoInputs ? `A ${operator} B` : `${operator} ${data.value ?? "?"}`} />
  );
}

export const nodeTypes = {
  trigger: ({ data, selected }: NodeProps<TriggerNode>) => <NodeCard type="trigger" selected={selected} text={`Every ${data.timeframe}`} />,
  indicator: ({ data, selected }: NodeProps<IndicatorNode>) => (
    <NodeCard type="indicator" selected={selected} text={`${data.indicator}(${data.period ?? "?"}) · ${data.timeframe}`} />
  ),
  condition: ConditionCard,
  logic: ({ data, selected }: NodeProps<LogicNode>) => <NodeCard type="logic" selected={selected} text={data.operator} />,
  action: ({ data, selected }: NodeProps<ActionNode>) => (
    <NodeCard type="action" selected={selected} text={data.action === "HOLD" ? "HOLD" : `${data.action} ${data.percentage ?? "?"}%`} />
  ),
};
