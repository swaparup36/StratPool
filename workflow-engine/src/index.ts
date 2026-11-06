import { copyFile, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { UnrecoverableError, Worker } from "bullmq";
import { Redis } from "ioredis";
import { ZodError } from "zod";
import { chainConfig, env } from "./config.js";
import { generateStrategy } from "./generate.js";
import { initProject, installDependencies, simulate } from "./sandbox.js";
import { jobSchema, limitFor, toOnchainId } from "./schema.js";
import { assign, loadStrategy, resolvePool } from "./strategy.js";

const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

const template = (name: string) => fileURLToPath(new URL(`../template/${name}`, import.meta.url));

const GAS_LIMIT = "1500000";

async function createWorkflow(data: unknown) {
  const job = jobSchema.parse(data);
  const project = "project";

  const strategy = await loadStrategy(job.strategyId);
  const { assignmentId, investor } = await assign(job.requirement_id, job.strategyId, strategy.chain);
  const name = `workflow-${assignmentId}`;
  const chain = chainConfig(strategy.chain, strategy.version);
  const pool = await resolvePool(chain.subgraphUrl, strategy.version, strategy.poolId, strategy.tradingPair, env.CRE_THE_GRAPH_API_KEY);
  const strategySource = generateStrategy(strategy.graph);

  const dir = await realpath(await mkdtemp(join(tmpdir(), "stratpool-")));
  try {
    await initProject(dir, project, name);

    const workflowDir = join(dir, project, name);
    const { feeBps, baseToken, quoteToken, ...market } = pool;

    await copyFile(template("main.ts"), join(workflowDir, "main.ts"));
    await copyFile(template("lib.ts"), join(workflowDir, "lib.ts"));
    await writeFile(join(workflowDir, "strategy.ts"), strategySource);
    await writeFile(
      join(workflowDir, "config.production.json"),
      JSON.stringify({
        chainName: chain.name,
        chainId: chain.id,
        commissionManager: chain.commissionManager,
        investor,
        strategist: strategy.strategist,
        assignmentId: toOnchainId(assignmentId),
        subgraphUrl: chain.subgraphUrl,
        poolId: strategy.poolId,
        ...market,
        limits: {
          base: limitFor(strategy.assets, chain.id, baseToken),
          quote: limitFor(strategy.assets, chain.id, quoteToken),
        },
        maxSlippageBps: env.SLIPPAGE_BPS + feeBps,
        gasLimit: GAS_LIMIT,
      }),
    );
    await writeFile(
      join(workflowDir, "workflow.yaml"),
      `production-settings:
  user-workflow:
    workflow-name: "${name}"
    deployment-registry: "${env.CRE_DEPLOYMENT_REGISTRY}"
  workflow-artifacts:
    workflow-path: "./main.ts"
    config-path: "./config.production.json"
    secrets-path: "../secrets.yaml"
`,
    );

    await writeFile(
      join(dir, project, "project.yaml"),
      `production-settings:
  rpcs:
    - chain-name: ${chain.name}
      url: \${${chain.rpcEnvName}}
`,
    );
    await writeFile(join(dir, project, "secrets.yaml"), "secretsNames:\n  THE_GRAPH_API_KEY:\n    - CRE_THE_GRAPH_API_KEY\n");

    await installDependencies(dir, project, name);
    const output = await simulate(dir, project, name, chain.rpcEnvName);

    return { workflowName: name, output };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// One at a time, so each simulation's terminal output stays readable.
const worker = new Worker(
  "workflow-queue",
  async (job) => {
    try {
      console.log(`Starting simulation with job ${JSON.stringify(job.data)}`);
      return await createWorkflow(job.data);
    } catch (error) {
      // A malformed job fails the same way every time, so retrying can't help.
      if (error instanceof ZodError) throw new UnrecoverableError(error.message);
      throw error;
    }
  },
  { connection: redis, concurrency: 1 },
);

worker.on("completed", (job, result) => console.log(`Simulated ${result.workflowName} (job ${job.id})`));
worker.on("failed", (job, error) => console.error(`Job ${job?.id} failed: ${error.message}`));

console.log("workflow-engine listening on workflow-queue");
