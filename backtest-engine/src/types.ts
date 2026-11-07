import { z } from "zod";
import { reqSchema } from "./schema.js";

export type Requirement = z.infer<typeof reqSchema>;

export type Strategy = {
  id: string;
  name: string;
  description: string;
  chain: string;
  tradingType: string;
  tradingPair: string;
  protocol: string;
  poolAddress: string;
  acceptedAssets: Array<string>;
  minInvestment: string;
  maxInvestment: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  isVerified: boolean;
};

export type TriggerNode = {
  id: string;
  type: "trigger";
  data: {
    timeframe: string;
  };
};

export type IndicatorNode = {
  id: string;
  type: "indicator";
  data: {
    indicator: "RSI" | "SMA" | "EMA";
    period: number;
    timeframe: string;
  };
};

export type ConditionNode = {
  id: string;
  type: "condition";
  data: {
    operator: "CROSS_ABOVE" | "CROSS_BELOW" | "LESS_THAN" | "GREATER_THAN";
    referenceType: "VALUE";
    value: number;
  };
};

export type ActionNode = {
  id: string;
  type: "action";
  data: {
    action: "BUY" | "SELL" | "HOLD";
    percentage: number;
  };
};

export type StrategyNode =
  | TriggerNode
  | IndicatorNode
  | ConditionNode
  | ActionNode;

export type StrategyEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

export type StrategyGraph = {
  version: number;
  nodes: StrategyNode[];
  edges: StrategyEdge[];
};

export type SaveBacktestInput = {
  strategyId: string;
  initialCapital: number;
  finalEquity: number;
  netReturnPct: number;
  maxDrawdownPct: number;
  totalTrades: number;
  periodStart: Date;
  periodEnd: Date;
};

export type Candle = {
  open: number;
  close: number;
};

export type BacktestResult = {
  portfolio: Portfolio;
  equityCurve: number[];
};

export type Portfolio = {
  usdc: number;
  eth: number;
  trades: Trade[];
};

export type Trade = {
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  fee: number;
};

export type Swap = {
  id: string;
  timestamp: string;
  sqrtPriceX96: string;
};

export type TradingSignal = "BUY" | "SELL" | "HOLD";
