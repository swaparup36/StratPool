import type { Swap, Candle } from "../../types.js";

function calculatePrice(sqrtPriceX96: string): number {
  const sqrtPrice = Number(sqrtPriceX96) / 2 ** 96;

  return sqrtPrice ** 2 * 10 ** 12;
}

export async function fetchUniswapCandles(
  endpoint: string,
  poolId: string,
  from: number,
  to: number,
): Promise<Candle[]> {
  if (!/^0x[a-fA-F0-9]{64}$/.test(poolId)) {
    throw new Error("Invalid Uniswap V4 Pool ID");
  }

  if (!Number.isInteger(from) || !Number.isInteger(to) || from >= to) {
    throw new Error("Invalid time range");
  }

  const query = `
    query GetSwaps(
      $pool: String!
      $from: BigInt!
      $to: BigInt!
      $skip: Int!
    ) {
      swaps(
        first: 1000
        skip: $skip
        orderBy: timestamp
        orderDirection: asc
        where: {
          pool: $pool
          timestamp_gte: $from
          timestamp_lt: $to
        }
      ) {
        id
        timestamp
        sqrtPriceX96
      }
    }
  `;

  const candles = new Map<number, Candle>();

  const HOUR = 3600;
  const MAX_PAGES_PER_WINDOW = 20;

  for (let windowStart = from; windowStart < to; windowStart += HOUR) {
    const windowEnd = Math.min(windowStart + HOUR, to);

    let skip = 0;
    let page = 0;

    while (true) {
      if (page >= MAX_PAGES_PER_WINDOW) {
        throw new Error(`Too many swaps in window ${windowStart}`);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: {
            pool: poolId.toLowerCase(),
            from: String(windowStart),
            to: String(windowEnd),
            skip,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = (await response.json()) as any;

      if (result.errors?.length) {
        throw new Error(JSON.stringify(result.errors));
      }

      const swaps = result.data?.swaps as Swap[] | undefined;

      if (!swaps) {
        throw new Error("Missing swap data");
      }

      for (const swap of swaps) {
        const timestamp = Number(swap.timestamp);
        const hour = Math.floor(timestamp / HOUR) * HOUR;
        const price = calculatePrice(swap.sqrtPriceX96);

        if (!Number.isFinite(price) || price <= 0) {
          throw new Error("Invalid swap price");
        }

        const candle = candles.get(hour);

        if (!candle) {
          candles.set(hour, {
            timestamp: hour,
            open: price,
            close: price,
          });
        } else {
          candle.close = price;
        }
      }

      if (swaps.length < 1000) break;

      skip += swaps.length;
      page++;
    }
  }

  return [...candles.values()].sort((a, b) => a.timestamp - b.timestamp);
}
