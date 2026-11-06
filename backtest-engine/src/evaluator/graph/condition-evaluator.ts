import type { ConditionNode } from "../../types.js";

export function evaluateCondition(
  node: ConditionNode,
  previousValue: number,
  currentValue: number,
): boolean {
  const { operator, value, referenceType } = node.data;

  if (referenceType !== "VALUE") {
    throw new Error("Unsupported reference type");
  }

  if (
    !Number.isFinite(previousValue) ||
    !Number.isFinite(currentValue) ||
    !Number.isFinite(value)
  ) {
    throw new Error("Invalid condition values");
  }

  switch (operator) {
    case "CROSS_ABOVE":
      return previousValue <= value && currentValue > value;

    case "CROSS_BELOW":
      return previousValue >= value && currentValue < value;

    case "LESS_THAN":
      return currentValue < value;

    case "GREATER_THAN":
      return currentValue > value;

    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}
