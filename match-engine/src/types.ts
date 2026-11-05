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
};
