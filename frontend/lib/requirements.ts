import { z } from "zod";
import { CHAINS, DECIMAL, decimalHint, RISK_LEVELS, TRADING_PAIR, TRADING_TYPES } from "@/components/strategy-builder/schema";
import { send } from "@/lib/strategies";

export const DURATION_TYPES = ["FIXED", "FLEXIBLE"] as const;
export const DURATION_UNITS = ["DAYS", "MONTHS"] as const;

export const requirementSchema = z
  .object({
    amount: z
      .string("Enter an amount")
      .trim()
      .regex(DECIMAL, `Amount ${decimalHint}`)
      .refine((v) => /[1-9]/.test(v), "Amount must be greater than 0"),
    asset: z.string("Enter an asset").trim().regex(/^\S{1,20}$/, "Enter a valid token symbol"),
    chain: z.enum(CHAINS, "Choose a chain"),
    tradingType: z.enum(TRADING_TYPES, "Choose a trading type"),
    tradingPairs: z
      .array(z.string().trim().toUpperCase().regex(TRADING_PAIR, "Each trading pair must look like ETH/USDC"), "Add at least one trading pair")
      .min(1, "Add at least one trading pair")
      .max(20, "Add at most 20 trading pairs")
      .transform((pairs) => [...new Set(pairs)]),
    riskLevel: z.enum(RISK_LEVELS, "Choose a risk level"),
    durationType: z.enum(DURATION_TYPES, "Choose a duration type"),
    durationValue: z.number("Duration must be a number").int("Duration must be a whole number").min(1, "Duration must be at least 1").max(3650, "Duration can be at most 3650").nullish(),
    durationUnit: z.enum(DURATION_UNITS, "Choose days or months").nullish(),
  })
  .superRefine(({ durationType, durationValue, durationUnit }, ctx) => {
    if (durationType === "FIXED" && (durationValue == null || !durationUnit)) {
      ctx.addIssue({ code: "custom", message: "A fixed duration needs a length and a unit" });
    }
  })
  .transform(({ durationValue, durationUnit, ...rest }) =>
    rest.durationType === "FIXED"
      ? { ...rest, durationValue: durationValue!, durationUnit: durationUnit! }
      : { ...rest, durationValue: null, durationUnit: null }
  );

export type RequirementForm = z.input<typeof requirementSchema>;

export const createRequirement = (payload: RequirementForm) => send("/api/requirements", "POST", "Failed to post requirement", payload);
