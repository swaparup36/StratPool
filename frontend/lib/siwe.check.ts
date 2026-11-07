import assert from "node:assert/strict";
import { isAppDomain } from "./siwe";

const app = "app.stratpool.xyz";

assert.equal(isAppDomain(app, app, "production"), true);
assert.equal(isAppDomain("localhost:3000", app, "production"), false);
assert.equal(isAppDomain("evil.xyz", app, "production"), false);
assert.equal(isAppDomain(undefined, undefined, "production"), false);

assert.equal(isAppDomain(app, app, "development"), true);
assert.equal(isAppDomain("localhost:3000", app, "development"), true);
assert.equal(isAppDomain("localhost", app, "development"), true);
assert.equal(isAppDomain("localhost.evil.xyz", app, "development"), false);
assert.equal(isAppDomain("evil.xyz", app, "development"), false);

console.log("siwe checks passed");
