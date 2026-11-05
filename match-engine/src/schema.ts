import { z } from "zod";

export const envConfigSchema = z.object({
  DB_URI: z.url(),
});

export const reqSchema = z.object({
  investment: z.object({
    amount: z.number(),
    asset: z.string(),
    chain: z.string(),
  }),
  preferences: z.object({
    tradingType: z.string(),
    tradingPairs: z.array(z.string()),
    riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  }),
  duration: z.object({
    type: z.string(),
    value: z.number(),
    unit: z.string(),
  }),
});
