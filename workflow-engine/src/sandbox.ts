import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { env } from "./config.js";

const exec = promisify(execFile);

const TARGET = "production-settings";
const TEMPLATE = "hello-world-ts";

// checks that the sandbox image is available and prints its version. Throws if not
export async function inSandbox(dir: string, workdir: string, command: string[], envNames: string[]) {
  const session = env.CRE_SESSION_DIR ?? join(homedir(), ".cre");
  const user = process.getuid && process.getgid ? ["--user", `${process.getuid()}:${process.getgid()}`] : [];

  const run = exec(
    "docker",
    [
      "run", "--rm",
      "--cap-drop", "ALL",
      "--security-opt", "no-new-privileges",
      "--memory", "4g",
      "--pids-limit", "1024",
      ...user,
      "-v", `${dir}:/workspace`,
      "-v", `${session}:/home/cre/.cre`,
      "-w", `/workspace/${workdir}`,
      ...envNames.flatMap((name) => ["-e", name]),
      env.SANDBOX_IMAGE,
      ...command,
    ],
    { maxBuffer: 16 * 1024 * 1024, timeout: 15 * 60 * 1000 },
  );
  run.child.stdout?.pipe(process.stdout);
  run.child.stderr?.pipe(process.stderr);
  return (await run).stdout;
}

export async function initProject(dir: string, project: string, workflow: string) {
  await inSandbox(
    dir,
    "",
    [
      "cre", "init", "--non-interactive",
      "--project-name", project,
      "--workflow-name", workflow,
      "--template", TEMPLATE,
      "--deployment-registry", env.CRE_DEPLOYMENT_REGISTRY,
    ],
    ["CRE_API_KEY"],
  );
  
  await rm(join(dir, project, ".env"));
}

export async function installDependencies(dir: string, project: string, workflow: string) {
  await inSandbox(dir, `${project}/${workflow}`, ["bun", "add", "viem"], []);
}

// each workflow runs in its own sandbox, so it can have its own RPC and API keys
export async function pushSecrets(
  dir: string,
  project: string,
  rpcEnvNames: string[],
  store: { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<unknown> },
) {
  const key = "workflow-engine:secrets-hash";
  const hash = createHash("sha256").update(env.CRE_THE_GRAPH_API_KEY).digest("hex");
  if ((await store.get(key)) === hash) return;

  const names = ["CRE_ETH_PRIVATE_KEY", "CRE_THE_GRAPH_API_KEY", ...rpcEnvNames];
  const secrets = (verb: string) => ["cre", "secrets", verb, "secrets.yaml", "--target", TARGET, "--non-interactive"];

  try {
    await inSandbox(dir, project, secrets("create"), names);
  } catch {
    // Already stored under this owner, with an older value
    await inSandbox(dir, project, secrets("update"), names);
  }
  await store.set(key, hash);
}

// function to simulate a workflow in a sandbox, returning its stdout
export async function simulate(dir: string, project: string, workflow: string, rpcEnvName: string) {
  return inSandbox(
    dir,
    project,
    ["cre", "workflow", "simulate", workflow, "--target", TARGET, "--non-interactive", "--trigger-index", "0"],
    ["CRE_THE_GRAPH_API_KEY", rpcEnvName],
  );
}

// export async function deploy(dir: string, project: string, workflow: string, rpcEnvNames: string[]) {
//   return inSandbox(
//     dir,
//     project,
//     ["cre", "workflow", "deploy", workflow, "--target", TARGET, "--yes", "--non-interactive"],
//     ["CRE_API_KEY", "CRE_ETH_PRIVATE_KEY", ...rpcEnvNames],
//   );
// }
