// Records each closed trade in Postgres, so P&L can be totalled by requirement, strategy or investor.
import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import pg from "pg";
import { createPublicClient, http, parseAbiItem, type Log } from "viem";
import { env, indexedChains } from "./config.js";
import { fromOnchainId } from "./schema.js";

const tradeClosed = parseAbiItem(
  "event TradeClosed(address indexed vault, bytes32 indexed assignmentId, address indexed token, uint256 cost, uint256 proceeds, uint256 commission)",
);

const BATCH_BLOCKS = 2000n; // RPCs limit how many blocks one getLogs call can span
const POLL_MS = 60_000;

const pool = new pg.Pool({ connectionString: env.DB_URI });

type Chain = ReturnType<typeof indexedChains>[number];
type TradeLog = Log<bigint, number, false, typeof tradeClosed, true>;

async function saveTrade(chainId: number, log: TradeLog, closedAt: Date) {
  const { assignmentId: tag, token, cost, proceeds, commission } = log.args;
  const assignmentId = fromOnchainId(tag);

  // Skipping keeps one bad report from stalling every trade after it.
  const known = await pool.query(`SELECT 1 FROM "strategyAssignment" WHERE id = $1`, [assignmentId]);
  if (known.rowCount === 0) {
    console.error(`Skipping trade in ${log.transactionHash}: unknown assignment ${assignmentId}`);
    return;
  }

  await pool.query(
    `INSERT INTO "Trade" (id, "assignmentId", "chainId", token, cost, proceeds, commission, "txHash", "logIndex", "blockNumber", "closedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT ("chainId", "txHash", "logIndex") DO NOTHING`,
    [randomUUID(), assignmentId, chainId, token, cost.toString(), proceeds.toString(), commission.toString(), log.transactionHash, log.logIndex, Number(log.blockNumber), closedAt],
  );
}

// ponytail: resumes from the last recorded trade, not a saved cursor, so a restart rescans any quiet blocks since then. Saves are idempotent, so this only costs RPC calls.
async function startingBlock({ id, startBlock }: Chain) {
  const { rows } = await pool.query<{ last: number | null }>(`SELECT max("blockNumber") AS last FROM "Trade" WHERE "chainId" = $1`, [id]);
  const last = rows[0]?.last;
  return last == null ? startBlock : BigInt(last);
}

async function watch(chain: Chain) {
  const client = createPublicClient({ transport: http(chain.rpcUrl) });
  let next: bigint | undefined;

  for (;;) {
    try {
      let from: bigint = next ?? (await startingBlock(chain));

      // Only finalized blocks are read, so a recorded trade can't be undone by a reorg.
      const { number: head } = await client.getBlock({ blockTag: "finalized" });

      while (from <= head) {
        const to: bigint = from + BATCH_BLOCKS - 1n < head ? from + BATCH_BLOCKS - 1n : head;
        const logs = (await client.getLogs({ address: chain.commissionManager, event: tradeClosed, strict: true, fromBlock: from, toBlock: to })) as TradeLog[];

        for (const log of logs) {
          const { timestamp } = await client.getBlock({ blockNumber: log.blockNumber });
          await saveTrade(chain.id, log, new Date(Number(timestamp) * 1000));
        }
        from = to + 1n;
        next = from; // only moves after a batch is saved, so the next poll retries what failed
      }
    } catch (error) {
      console.error(`Indexing chain ${chain.id} failed:`, error);
    }
    await sleep(POLL_MS);
  }
}

const chains = indexedChains();
if (chains.length === 0) throw new Error("No chain to index: set COMMISSION_MANAGER_<CHAIN>");

console.log(`Indexing TradeClosed on chains ${chains.map((chain) => chain.id).join(", ")}`);
await Promise.all(chains.map(watch));
