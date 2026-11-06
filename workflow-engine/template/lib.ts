// Copied into every workflow. Pure, so it runs the same in the CRE WASM sandbox and in tests.
// The indicators match backtest-engine, so a workflow signals as the strategy's backtest did.
import { encodeAbiParameters, encodeFunctionData, encodePacked, parseAbi, parseAbiParameters, type Address, type Hex } from "viem"

export type Closes = Record<string, number[]>
export type Signal = { action: "BUY" | "SELL"; percentage: number; matched: boolean }
export type Operator = "GREATER_THAN" | "LESS_THAN" | "CROSS_ABOVE" | "CROSS_BELOW"
export type PoolKey = { currency0: Address; currency1: Address; fee: number; tickSpacing: number; hooks: Address }

const need = (prices: number[], count: number) => {
  if (prices.length < count) throw new Error(`Insufficient price data: ${prices.length} of ${count}`)
}

export const sma = (prices: number[], period: number): number[] => {
  need(prices, period)
  const result: number[] = []
  for (let i = period - 1; i < prices.length; i++) {
    result.push(prices.slice(i - period + 1, i + 1).reduce((sum, price) => sum + price, 0) / period)
  }
  return result
}

export const ema = (prices: number[], period: number): number[] => {
  need(prices, period)
  const multiplier = 2 / (period + 1)
  let previous = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period
  const result = [previous]
  for (let i = period; i < prices.length; i++) {
    previous = (prices[i]! - previous) * multiplier + previous
    result.push(previous)
  }
  return result
}

export const rsi = (prices: number[], period: number): number[] => {
  need(prices, period + 1)
  const gains: number[] = []
  const losses: number[] = []
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i]! - prices[i - 1]!
    gains.push(Math.max(change, 0))
    losses.push(Math.max(-change, 0))
  }

  const value = (gain: number, loss: number) => {
    if (gain === 0 && loss === 0) return 50
    if (loss === 0) return 100
    if (gain === 0) return 0
    return 100 - 100 / (1 + gain / loss)
  }

  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period
  const result = [value(avgGain, avgLoss)]
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]!) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]!) / period
    result.push(value(avgGain, avgLoss))
  }
  return result
}

// a and b are indicator series ending on the same candle; a fixed value is the same on every candle.
export const compare = (operator: Operator, a: number[], b: number[] | number): boolean => {
  const at = (series: number[] | number, back: number) =>
    typeof series === "number" ? series : series[series.length - 1 - back]

  const [current, previous] = [at(a, 0), at(a, 1)]
  const [refCurrent, refPrevious] = [at(b, 0), at(b, 1)]
  if (current === undefined || refCurrent === undefined) throw new Error("Insufficient indicator data")

  if (operator === "GREATER_THAN") return current > refCurrent
  if (operator === "LESS_THAN") return current < refCurrent

  if (previous === undefined || refPrevious === undefined) throw new Error("Insufficient indicator data")
  return operator === "CROSS_ABOVE"
    ? previous <= refPrevious && current > refCurrent
    : previous >= refPrevious && current < refCurrent
}

// Quote per base from a swap's sqrtPriceX96. The rounding lets every DON node agree on the same value.
export const priceFromSqrt = (sqrtPriceX96: string, decimals0: number, decimals1: number, baseIsToken0: boolean) => {
  const price = (Number(sqrtPriceX96) / 2 ** 96) ** 2 * 10 ** (decimals0 - decimals1)
  return Number((baseIsToken0 ? price : 1 / price).toPrecision(10))
}

// ponytail: priced from the last completed minute's swap, ignoring the trade's own price impact. A trade too large
// for the pool reverts onchain; quote through V4Quoter if vaults outgrow their pools.
export const minAmountOut = (amountIn: bigint, sqrtPriceX96: bigint, zeroForOne: boolean, maxSlippageBps: number) => {
  const q192 = 1n << 192n
  const price = sqrtPriceX96 * sqrtPriceX96
  const expected = zeroForOne ? (amountIn * price) / q192 : (amountIn * q192) / price
  return (expected * BigInt(10_000 - maxSlippageBps)) / 10_000n
}

export const percentOf = (amount: bigint, percentage: number) => (amount * BigInt(Math.round(percentage * 100))) / 10_000n

export type TradeLimit = { min: string; max: string | null }

// The action's percentage of the balance, held within the strategist's limits. The result can exceed the balance when
// the minimum does, so the caller must still check that the vault can pay it.
export const tradeSize = (available: bigint, percentage: number, limit: TradeLimit | null) => {
  const amount = percentOf(available, percentage)
  if (!limit) return amount

  const min = BigInt(limit.min)
  if (amount < min) return min
  return limit.max !== null && amount > BigInt(limit.max) ? BigInt(limit.max) : amount
}

const routerAbi = parseAbi(["function execute(bytes commands, bytes[] inputs, uint256 deadline) payable"])

const V3_SWAP_EXACT_IN = 0x00
const V4_SWAP = 0x10
const SWAP_EXACT_IN_SINGLE = 0x06
const SETTLE_ALL = 0x0c
const TAKE_ALL = 0x0f

const execute = (command: number, input: Hex, deadline: bigint): Hex =>
  encodeFunctionData({
    abi: routerAbi,
    functionName: "execute",
    args: [encodePacked(["uint8"], [command]), [input], deadline],
  })

const MSG_SENDER = "0x0000000000000000000000000000000000000001" // the router's stand-in for its caller, the vault

// Universal Router 2.1.2 calldata for one exact-in swap. minHopPriceX36 is left unset because the vault enforces minOut itself.
const encodeV3Swap = (key: PoolKey, tokenIn: Address, tokenOut: Address, amountIn: bigint, minOut: bigint, deadline: bigint): Hex => {
  const path = encodePacked(["address", "uint24", "address"], [tokenIn, key.fee, tokenOut])
  const input = encodeAbiParameters(parseAbiParameters("address, uint256, uint256, bytes, bool, uint256[]"), [
    MSG_SENDER,
    amountIn,
    minOut,
    path,
    true, // the router pulls from the vault through Permit2
    [],
  ])
  return execute(V3_SWAP_EXACT_IN, input, deadline)
}

const encodeV4Swap = (key: PoolKey, tokenIn: Address, tokenOut: Address, amountIn: bigint, minOut: bigint, deadline: bigint): Hex => {
  const swap = encodeAbiParameters(
    parseAbiParameters(
      "((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, bool zeroForOne, uint128 amountIn, uint128 amountOutMinimum, uint256 minHopPriceX36, bytes hookData)",
    ),
    [{ poolKey: key, zeroForOne: tokenIn.toLowerCase() === key.currency0.toLowerCase(), amountIn, amountOutMinimum: minOut, minHopPriceX36: 0n, hookData: "0x" }],
  )
  const settle = encodeAbiParameters(parseAbiParameters("address, uint256"), [tokenIn, amountIn])
  const take = encodeAbiParameters(parseAbiParameters("address, uint256"), [tokenOut, minOut])

  const actions = encodePacked(["uint8", "uint8", "uint8"], [SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE_ALL])
  const input = encodeAbiParameters(parseAbiParameters("bytes, bytes[]"), [actions, [swap, settle, take]])

  return execute(V4_SWAP, input, deadline)
}

export const encodeRouterSwap = (version: 3 | 4, ...swap: Parameters<typeof encodeV3Swap>): Hex =>
  version === 3 ? encodeV3Swap(...swap) : encodeV4Swap(...swap)

const SWAP_ACTION = 2 // CommissionManager.Action.Swap

export const encodeSwapReport = (chainId: number, investor: Address, strategist: Address, assignmentId: Hex, tokenIn: Address, amountIn: bigint, tokenOut: Address, minOut: bigint, routerData: Hex): Hex =>
  encodeAbiParameters(parseAbiParameters("uint256, uint8, address, address, bytes32, address, uint256, address, uint256, bytes"), [
    BigInt(chainId),
    SWAP_ACTION,
    investor,
    strategist,
    assignmentId,
    tokenIn,
    amountIn,
    tokenOut,
    minOut,
    routerData,
  ])
