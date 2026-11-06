// Copied into every workflow; strategy.ts next to it is generated from the strategy's graph.
import {
  bytesToHex,
  consensusIdenticalAggregation,
  CronCapability,
  encodeCallMsg,
  EVMClient,
  getNetwork,
  handler,
  HTTPClient,
  LAST_FINALIZED_BLOCK_NUMBER,
  ok,
  prepareReportRequest,
  Runner,
  TxStatus,
  type NodeRuntime,
  type Runtime,
} from "@chainlink/cre-sdk"
import { EVM_PB } from "@chainlink/cre-sdk/pb"
import { decodeFunctionResult, encodeFunctionData, parseAbi, zeroAddress, type Address, type Hex } from "viem"
import { encodeRouterSwap, encodeSwapReport, minAmountOut, priceFromSqrt, tradeSize, type Closes, type PoolKey, type TradeLimit } from "./lib"
import { decide, SCHEDULE, TIMEFRAMES } from "./strategy"

type Config = {
  chainName: string
  chainId: number
  commissionManager: Address
  investor: Address
  strategist: Address
  assignmentId: Hex
  subgraphUrl: string
  poolId: string
  version: 3 | 4
  poolKey: PoolKey
  base: Address
  quote: Address
  limits: { base: TradeLimit | null; quote: TradeLimit | null }
  decimals0: number
  decimals1: number
  maxSlippageBps: number
  gasLimit: string
}

type Market = { closes: Closes; spotSqrtPriceX96: string }

const abi = parseAbi([
  "function vaultDeployer() view returns (address)",
  "function vaultOf(address investor) view returns (address)",
  "function unlockedBalance(address token) view returns (uint256)",
])

const lastSwapBefore = (alias: string, timestamp: number) =>
  `${alias}: swaps(first: 1, orderBy: timestamp, orderDirection: desc, where: { pool: $pool, timestamp_lt: "${timestamp}" }) { sqrtPriceX96 }`

// Same source and price formula as the backtest engine, but a candle's close is its last swap before the candle ended,
// so one request covers a whole timeframe and quiet candles carry the previous close. Only finished candles are read,
// which is what lets every node see the same data.
const fetchMarket = (runtime: NodeRuntime<Config>, now: number, apiKey: string): string => {
  const { subgraphUrl, poolId, base, poolKey, decimals0, decimals1 } = runtime.config
  const http = new HTTPClient()

  const query = (selections: string[]) => {
    const body = JSON.stringify({
      query: `query ($pool: String!) { ${selections.join(" ")} }`,
      variables: { pool: poolId.toLowerCase() },
    })
    const response = http
      .sendRequest(runtime, {
        url: subgraphUrl,
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: Buffer.from(new TextEncoder().encode(body)).toString("base64"),
      })
      .result()
    if (!ok(response)) throw new Error(`Subgraph responded with HTTP ${response.statusCode}`)

    const result = JSON.parse(new TextDecoder().decode(response.body))
    if (result.errors?.length || !result.data) throw new Error(`Subgraph error: ${JSON.stringify(result.errors)}`)
    return result.data as Record<string, { sqrtPriceX96: string }[]>
  }

  const baseIsToken0 = base.toLowerCase() === poolKey.currency0.toLowerCase()
  const closes: Closes = {}
  for (const { timeframe, seconds, candles } of TIMEFRAMES) {
    const end = Math.floor(now / seconds) * seconds
    const selections = Array.from({ length: candles }, (_, i) => lastSwapBefore(`c${i}`, end - (candles - 1 - i) * seconds))
    const data = query(selections)
    closes[timeframe] = selections.flatMap((_, i) => {
      const swap = data[`c${i}`]?.[0]
      return swap ? [priceFromSqrt(swap.sqrtPriceX96, decimals0, decimals1, baseIsToken0)] : []
    })
  }

  const spot = query([lastSwapBefore("spot", Math.floor(now / 60) * 60)]).spot?.[0]
  if (!spot) throw new Error("Pool has no swaps")

  return JSON.stringify({ closes, spotSqrtPriceX96: spot.sqrtPriceX96 } satisfies Market)
}

const onTrigger = (runtime: Runtime<Config>): string => {
  const { chainName, chainId, commissionManager, investor, strategist, assignmentId, version, poolKey, base, quote, limits, maxSlippageBps, gasLimit } = runtime.config
  const now = Math.floor(runtime.now().getTime() / 1000)

  const apiKey = runtime.getSecret({ id: "THE_GRAPH_API_KEY" }).result().value
  const market: Market = JSON.parse(runtime.runInNodeMode(fetchMarket, consensusIdenticalAggregation<string>())(now, apiKey).result())

  const signals = decide(market.closes)
  if (signals.length === 0) return "no signal"
  if (signals.length > 1) {
    runtime.log(`Conflicting actions: ${signals.map((signal) => signal.action).join(", ")}. Not trading.`)
    return "conflicting signals"
  }
  const { action, percentage } = signals[0]!

  const network = getNetwork({ chainFamily: "evm", chainSelectorName: chainName })
  if (!network) throw new Error(`Unknown chain: ${chainName}`)
  const evm = new EVMClient(network.chainSelector.selector)

  const read = <T>(to: Address, functionName: "vaultDeployer" | "vaultOf" | "unlockedBalance", args: Address[]): T => {
    const data = encodeFunctionData({ abi, functionName, args } as never)
    const reply = evm
      .callContract(runtime, { call: encodeCallMsg({ from: zeroAddress, to, data }), blockNumber: LAST_FINALIZED_BLOCK_NUMBER })
      .result()
    return decodeFunctionResult({ abi, functionName, data: bytesToHex(reply.data) }) as T
  }

  const vault = read<Address>(read<Address>(commissionManager, "vaultDeployer", []), "vaultOf", [investor])
  if (vault === zeroAddress) {
    runtime.log(`${investor} has no vault. Not trading.`)
    return "no vault"
  }

  const [tokenIn, tokenOut, limit] = action === "BUY" ? [quote, base, limits.quote] : [base, quote, limits.base]

  // Only what the investor could withdraw is tradable: locked commission stays out of it
  const available = read<bigint>(vault, "unlockedBalance", [tokenIn])
  const amountIn = tradeSize(available, percentage, limit)
  if (amountIn === 0n || amountIn > available) {
    runtime.log(`${action} needs ${amountIn} of ${tokenIn}, but the vault has ${available} available. Not trading.`)
    return "insufficient vault balance"
  }

  const zeroForOne = tokenIn.toLowerCase() === poolKey.currency0.toLowerCase()
  const minOut = minAmountOut(amountIn, BigInt(market.spotSqrtPriceX96), zeroForOne, maxSlippageBps)
  const routerData = encodeRouterSwap(version, poolKey, tokenIn, tokenOut, amountIn, minOut, BigInt(now + 300))

  const report = runtime
    .report(prepareReportRequest(encodeSwapReport(chainId, investor, strategist, assignmentId, tokenIn, amountIn, tokenOut, minOut, routerData)))
    .result()

  const write = evm.writeReport(runtime, { receiver: commissionManager, report, gasConfig: { gasLimit } }).result()
  const hash = write.txHash ? bytesToHex(write.txHash) : "unknown"
  if (write.txStatus !== TxStatus.SUCCESS) {
    throw new Error(`Trade failed: ${write.errorMessage ?? write.txStatus}`)
  }

  // The vault's swap reverts if the pool's price moved too far, so the trade didn't happen 
  if (write.receiverContractExecutionStatus === EVM_PB.ReceiverContractExecutionStatus.REVERTED) {
    throw new Error(`Trade reverted in the vault: ${hash}`)
  }

  runtime.log(`${action} ${amountIn} of ${tokenIn}: ${hash}`)
  return hash
}

const initWorkflow = () => [handler(new CronCapability().trigger({ schedule: SCHEDULE }), onTrigger)]

export async function main() {
  const runner = await Runner.newRunner<Config>()
  await runner.run(initWorkflow)
}
