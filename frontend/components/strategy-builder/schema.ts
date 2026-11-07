import type { Node } from "@xyflow/react";
import { parseUnits } from "viem";
import { z } from "zod";

export const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export const INDICATORS = ["RSI", "SMA", "EMA"] as const;
export const OPERATORS = ["GREATER_THAN", "LESS_THAN", "CROSS_ABOVE", "CROSS_BELOW"] as const;
export const REFERENCE_TYPES = ["VALUE", "INDICATOR"] as const;
export const LOGIC_OPERATORS = ["AND", "OR"] as const;
export const ACTIONS = ["BUY", "SELL", "HOLD"] as const;
export const CHAINS = ["ETHEREUM", "BASE", "SEPOLIA"] as const;
export const TRADING_TYPES = ["SPOT", "PERPETUALS"] as const;
export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;

export type Chain = (typeof CHAINS)[number];

const timeframe = z.enum(TIMEFRAMES, "Choose a valid timeframe");

const triggerData = z.object({ timeframe });
const indicatorData = z.object({
  indicator: z.enum(INDICATORS, "Choose RSI, SMA or EMA"),
  period: z.number("Period is required").int("Period must be a whole number").min(1, "Period must be at least 1").max(500, "Period can be at most 500"),
  timeframe,
});
const conditionData = z
  .object({
    operator: z.enum(OPERATORS, "Choose a valid operator"),
    referenceType: z.enum(REFERENCE_TYPES),
    value: z.number("Comparison value must be a number").nullable(),
  })
  .refine((d) => d.referenceType !== "VALUE" || d.value !== null, "Set a comparison value");
const logicData = z.object({ operator: z.enum(LOGIC_OPERATORS, "Choose AND or OR") });
const actionData = z
  .object({
    action: z.enum(ACTIONS, "Choose BUY, SELL or HOLD"),
    percentage: z.number("Allocation must be a number").gt(0, "Allocation must be above 0%").max(100, "Allocation can be at most 100%").nullable(),
  })
  .refine((d) => d.action === "HOLD" || d.percentage !== null, "Set the percentage of capital to allocate");

export type TriggerData = z.infer<typeof triggerData>;
export type IndicatorData = z.infer<typeof indicatorData>;
export type ConditionData = z.infer<typeof conditionData>;
export type LogicData = z.infer<typeof logicData>;
export type ActionData = z.infer<typeof actionData>;

export type TriggerNode = Node<TriggerData, "trigger">;
export type IndicatorNode = Node<IndicatorData, "indicator">;
export type ConditionNode = Node<ConditionData, "condition">;
export type LogicNode = Node<LogicData, "logic">;
export type ActionNode = Node<ActionData, "action">;
export type StrategyNode = TriggerNode | IndicatorNode | ConditionNode | LogicNode | ActionNode;
export type NodeType = StrategyNode["type"];

const CONNECTIONS: Record<NodeType, NodeType[]> = {
  trigger: ["indicator"],
  indicator: ["condition"],
  condition: ["logic", "action"],
  logic: ["logic", "action"],
  action: [],
};
export const canConnect = (source: NodeType, target: NodeType) => CONNECTIONS[source].includes(target);

// Logic blocks can feed each other, so a new edge from A to B must check that B doesn't already lead to A.
export function reaches(edges: readonly { source: string; target: string }[], from: string, to: string) {
  const seen = new Set<string>();
  const stack = [from];
  while (stack.length) {
    const id = stack.pop()!;
    if (id === to) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const edge of edges) if (edge.source === id) stack.push(edge.target);
  }
  return false;
}

const position = z.object({ x: z.number(), y: z.number() });

// Unknown keys are stripped, which keeps React Flow's selection and drag state out of the payload.
const graphSchema = z.object({
  version: z.literal(1),
  nodes: z.array(
    z.discriminatedUnion("type", [
      z.object({ id: z.string(), type: z.literal("trigger"), position, data: triggerData }),
      z.object({ id: z.string(), type: z.literal("indicator"), position, data: indicatorData }),
      z.object({ id: z.string(), type: z.literal("condition"), position, data: conditionData }),
      z.object({ id: z.string(), type: z.literal("logic"), position, data: logicData }),
      z.object({ id: z.string(), type: z.literal("action"), position, data: actionData }),
    ]),
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      sourceHandle: z.literal("output", "Connections must leave from an output handle"),
      targetHandle: z.enum(["input", "compare"], "Connections must arrive at an input handle"),
    }),
  ),
});
type Graph = z.infer<typeof graphSchema>;

export const TRADING_PAIR = /^[A-Z0-9]+\/[A-Z0-9]+$/;
export const DECIMAL = /^\d{1,18}(\.\d{1,18})?$/;
export const decimalHint ="must be a decimal number such as 100 or 0.5";

const optionalText = z.string().trim().nullish().transform((v) => v || null);

const assetRow = z.object({
  symbol: z.string("Enter a token symbol for each accepted asset").trim(),
  minInvestment: z.string("Minimum investment is required").trim(),
  maxInvestment: optionalText,
});

function assetIssues({ symbol, minInvestment: min, maxInvestment: max }: z.output<typeof assetRow>) {
  if (!symbol) return ["Enter a token symbol for each accepted asset"];
  if (!/^\S{1,20}$/.test(symbol)) return [`${symbol} isn't a valid token symbol`];

  const issues: string[] = [];
  if (!DECIMAL.test(min)) issues.push(`${symbol}: minimum investment ${decimalHint}`);
  if (max && !DECIMAL.test(max)) issues.push(`${symbol}: maximum investment ${decimalHint}`);
  if (issues.length) return issues;

  if (!/[1-9]/.test(min)) issues.push(`${symbol}: minimum investment must be greater than 0`);
  if (max && parseUnits(max, 18) <= parseUnits(min, 18)) issues.push(`${symbol}: maximum investment must be greater than the minimum`);
  return issues;
}

const metadataSchema = z
  .object({
    name: z.string().trim().min(1, "Strategy name is required").max(100, "Strategy name can be at most 100 characters"),
    description: z.string().trim().min(1, "Description is required").max(2000, "Description can be at most 2000 characters"),
    chain: z.enum(CHAINS, "Choose a chain"),
    tradingType: z.enum(TRADING_TYPES, "Choose a trading type"),
    tradingPair: z.string().trim().toUpperCase().regex(TRADING_PAIR, "Trading pair must look like ETH/USDC"),
    protocol: z.string().trim().toUpperCase().min(1, "Protocol is required"),
    poolAddress: optionalText.refine(
      (v) => !v || /^0x([0-9a-fA-F]{40}|[0-9a-fA-F]{64})$/.test(v),
      "Pool address must be a 0x address (40 hex characters) or a pool ID (64 hex characters)",
    ),
    acceptedAssets: z.array(assetRow, "Add at least one accepted asset").min(1, "Add at least one accepted asset"),
    riskLevel: z.enum(RISK_LEVELS, "Choose a risk level"),
    status: z.enum(["DRAFT", "PUBLISHED"], "A new strategy can only be a draft or published").default("DRAFT"),
  })
  .superRefine(({ acceptedAssets }, ctx) => {
    for (const message of acceptedAssets.flatMap(assetIssues)) ctx.addIssue({ code: "custom", message });
    const symbols = acceptedAssets.map((row) => row.symbol.toLowerCase()).filter(Boolean);
    if (new Set(symbols).size !== symbols.length) ctx.addIssue({ code: "custom", message: "Each accepted asset can only be added once" });
  });

// Form inputs are all strings; the schema above turns them into the payload's shape.
export type MetadataForm = z.input<typeof metadataSchema>;
export type AssetForm = MetadataForm["acceptedAssets"][number];
export type CreateStrategyPayload = z.output<typeof metadataSchema> & { graph: Graph };
export type SaveStatus = CreateStrategyPayload["status"];

export const emptyAsset: AssetForm = { symbol: "", minInvestment: "", maxInvestment: "" };

export const emptyMetadata: MetadataForm = {
  name: "",
  description: "",
  chain: "ETHEREUM",
  tradingType: "SPOT",
  tradingPair: "",
  protocol: "",
  poolAddress: "",
  acceptedAssets: [emptyAsset],
  riskLevel: "MEDIUM",
};

function graphIssues({ nodes, edges }: Graph) {
  const issues: string[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  if (!nodes.length) return ["Add at least one node to the canvas"];
  if (!nodes.some((n) => n.type === "trigger")) issues.push("Add a trigger to start the flow");
  if (!nodes.some((n) => n.type === "action")) issues.push("Add an action to end the flow");

  for (const { source, target, targetHandle } of edges) {
    const from = byId.get(source);
    const to = byId.get(target);
    if (!from || !to) issues.push(`A connection from ${source} to ${target} references a missing node`);
    else if (!canConnect(from.type, to.type)) issues.push(`A ${from.type} can't connect to a ${to.type} (${source} to ${target})`);
    else if (targetHandle === "compare" && to.type !== "condition") issues.push(`${target}: only a condition has an input B`);
  }
  if (edges.some((e) => reaches(edges, e.target, e.source))) issues.push("Logic blocks can't connect in a loop");

  for (const node of nodes) {
    const incoming = edges.filter((e) => e.target === node.id);
    if (node.type !== "trigger" && !incoming.length) issues.push(`${node.id}: connect an input to this ${node.type}`);
    if (node.type !== "action" && !edges.some((e) => e.source === node.id)) issues.push(`${node.id}: connect its output to the next step`);
    if (node.type === "logic" && incoming.length === 1) issues.push(`${node.id}: connect at least two inputs to this ${node.data.operator} block`);

    if (node.type === "condition") {
      const a = incoming.filter((e) => e.targetHandle === "input");
      const b = incoming.filter((e) => e.targetHandle === "compare");
      if (a.length > 1 || b.length > 1) issues.push(`${node.id}: each input takes only one indicator`);
      if (node.data.referenceType === "VALUE") {
        if (b.length) issues.push(`${node.id}: a fixed value comparison only uses input A`);
      } else if (incoming.length) {
        if (!a.length) issues.push(`${node.id}: connect an indicator to input A`);
        if (!b.length) issues.push(`${node.id}: connect a second indicator to input B`);
        if (a.some((e) => b.some((other) => other.source === e.source))) issues.push(`${node.id}: inputs A and B must be different indicators`);
      }
    }
  }
  return issues;
}

export type ValidationResult = { ok: true; payload: CreateStrategyPayload } | { ok: false; errors: string[] };

// validateStrategy checks the metadata and graph, returning a payload if valid or a list of issues if not
export function validateStrategy(metadata: unknown, nodes: readonly { id: string }[], edges: readonly unknown[]): ValidationResult {
  const meta = metadataSchema.safeParse(metadata);
  const graph = graphSchema.safeParse({ version: 1, nodes, edges });

  const errors = meta.success ? [] : meta.error.issues.map((i) => i.message);
  if (graph.success) {
    errors.push(...graphIssues(graph.data));
  } else {
    errors.push(
      ...graph.error.issues.map((i) => {
        const node = i.path[0] === "nodes" ? nodes[i.path[1] as number] : undefined;
        return node ? `${node.id}: ${i.message}` : i.message;
      }),
    );
  }

  if (!meta.success || !graph.success || errors.length) return { ok: false, errors };
  return { ok: true, payload: { ...meta.data, graph: graph.data } };
}
