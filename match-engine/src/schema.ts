import { z } from "zod";

export const envConfigSchema = z.object({
  DB_URI: z.url(),
  REDIS_URL: z.url(),
});

export const reqSchema = z.object({
  id: z.string(),
  amount: z.number(),
  investorId: z.string(),
  chain: z.string(),
  asset: z.string(),
  tradingType: z.string(),
  tradingPairs: z.array(z.string()),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  durationType: z.enum(["FIXED", "FLEXIBLE"]),
  durationValue: z.number().optional(),
  durationUnit: z.enum(["DAYS", "MONTHS"]).optional(),
  status: z.enum(["OPEN", "MATCHED", "CLOSED"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
