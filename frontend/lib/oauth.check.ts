import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { approvalStatement, isAllowedRedirectUri, parseAuthorizeRequest, sealClient, unsealClient, verifyPkce } from "./oauth";

async function main() {
  process.env.SESSION_SECRET = "x".repeat(32);
  process.env.NEXT_PUBLIC_API_URL = "https://stratpool.test/";

  for (const uri of ["https://agent.test/cb", "http://localhost:33418/cb", "http://127.0.0.1:9/cb"]) assert.ok(isAllowedRedirectUri(uri), uri);
  for (const uri of ["http://agent.test/cb", "http://localhost.evil.test/cb", "javascript:alert(1)", "https://agent.test/cb#x", "nope"]) assert.equal(isAllowedRedirectUri(uri), false, uri);

  const verifier = "v".repeat(43);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  assert.ok(verifyPkce(verifier, challenge));
  assert.equal(verifyPkce("w".repeat(43), challenge), false);
  assert.equal(verifyPkce("short", challenge), false);

  const client = { name: "Agent", redirectUris: ["https://agent.test/cb"] };
  const client_id = await sealClient(client);
  assert.deepEqual(await unsealClient(client_id), client);
  const middle = client_id.length >> 1;
  assert.equal(await unsealClient(client_id.slice(0, middle) + (client_id[middle] === "A" ? "B" : "A") + client_id.slice(middle + 1)), null);
  assert.equal(await unsealClient("garbage"), null);

  const valid = { response_type: "code", client_id, redirect_uri: "https://agent.test/cb", code_challenge: challenge, code_challenge_method: "S256" };
  const parse = (changes: object) => parseAuthorizeRequest({ ...valid, ...changes });
  assert.ok((await parse({})).ok);
  assert.ok((await parse({ resource: "https://stratpool.test/api/mcp" })).ok);
  for (const changes of [
    { redirect_uri: "https://evil.test/cb" },
    { client_id: "garbage" },
    { code_challenge_method: "plain" },
    { code_challenge_method: undefined },
    { code_challenge: "short" },
    { response_type: "token" },
    { resource: "https://evil.test/api/mcp" },
  ]) {
    assert.equal((await parse(changes)).ok, false, JSON.stringify(changes));
  }

  assert.ok(!approvalStatement("Agent", "https://agent.test/cb").includes("\n"));
  console.log("oauth checks passed");
}

main();
