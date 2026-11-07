# StratPool - AI Agent Log

Rewrite the landing page for StratPool
- Planned to reuse the frontend template and replace its SaaS content with StratPool's.
- Rewrote `app/(marketing)/page.tsx`: hero, how it works, strategists, investors, under the hood, CTA, FAQ.
- Replaced the chat/task mocks with illustrative product mocks in `components/mocks.tsx`; removed fake social proof and SaaS pricing.
- Rebranded logo, favicon, metadata and footer (added risk notice); header nav now links to landing sections; moved the theme toggle from footer to header.

Audit and fix the wallet sign-up/login flow
- Audited the flow against the spec, then fixed what blocked it: moved routes to the Prisma 8 client, used `address` to match the contract, fixed auth page links, added the Sepolia client, and fixed the `@x402` build failure in `next.config.ts`.
- Generated usernames on sign-up; dropped the leftover `publicKey` column from the database.
- Added backend input validation and clean verify errors; failed sign-ins now close the modal and show the error on the form; unsupported networks get a clear message.
- Themed the RainbowKit modals with the site's tokens (`auth-provider.tsx`, `globals.css`).
- Successful auth redirects to `/`; the header shows only Log Out when signed in. Placeholder `/app` page stays protected by `proxy.ts`.

Build the `/strategies/create` strategy builder (frontend only)
- Added `components/strategy-builder/`: React Flow canvas, draggable node library, node and metadata panels.
- Added `@xyflow/react`, `zod` and `lucide-react`; skipped Zustand because local state is enough.
- Enabled Publish: the payload now carries a validated `status` (`DRAFT` or `PUBLISHED`), which the API saves.
- Added AND/OR logic blocks between conditions and the action (loops rejected); indicator comparisons now use inputs A and B on the condition block instead of a dropdown.
- Moved min/max investment onto each accepted asset to match the new schema; strategists type each token symbol.
- Fixed `api/strategies/route.ts`: it runs the same validator as the builder, looks up each token's address and decimals through the LI.FI API (`lib/tokens.ts`), rejects unknown symbols, returns 503 if the API is unavailable, saves `poolAddress`, and creates the strategy and its assets in one nested write.

Help building `/strategies/my` and strategy editing
- Added the `/strategies/my` list of the user's drafts and published strategies, without the flow graph, with Edit, Publish or Take down, and Delete (confirmed in a modal) actions.
- `/strategies/edit/[strategy_id]` reuses the builder to change the graph and details; a Save keeps the current status.

Audit `stratpool-contracts` and write essential tests
- Audited the Vault, VaultDeployer and CommissionManager; findings reported to the user.
- Changed settlement to CRE forwarder -> `CommissionManager.onReport` (checks forwarder, workflow owner, chain) -> `Vault.requestTransfer` -> strategist; removed CRE from the vault and deployer.
- Added `test/StratPool.t.sol` covering deployment, owner-only withdrawal, locking, settlement and report validation.

Investor onboarding:
- `create-vault` connects the wallet, switches to Sepolia, sends `createVault` and redirects using the `VaultCreated` event; it rejects a wallet other than the account's.
- Dashboard layout only serves the investor's own vault; Vault and Invest pages are blank for now. `strategy-sidebar` became a shared `Sidebar`.

Vault page and per-chain vaults
- `components/vault-panel.tsx`: balances (in vault, locked commission, withdrawable, in wallet) and deposit/withdraw for ETH and ERC-20 (approval handled); tokens are added by symbol (address resolved per chain through LI.FI, then confirmed on-chain) and remembered per browser, because the vault can't list its tokens.
- Added a navbar chain selector on `/investors` pages (RainbowKit chain modal). Vault creation and the dashboard follow the wallet's chain through `VAULT_DEPLOYERS` in `lib/contracts.ts`; chains with no deployer show "not available" (only Sepolia is deployed).

Invest page: post and list investor requirements
- Dashboard Invest page lists the user's requirements newest first, with a "Strategized" badge when a `strategyAssignment` exists; "Post requirement" opens a form dialog (`components/post-requirement.tsx`).
- `POST /api/requirements` validates with `lib/requirements.ts` and checks the asset exists on the chain through LI.FI; stores the canonical symbol and `amount` in wei as a string, using the token's decimals for the chain and symbol. The Invest page converts it back for display.

Track P&L per investor requirement
- `CommissionManager`: swap reports carry an `assignmentId`, positions are keyed by it instead of strategist, and `TradeClosed` emits it with the commission. Requires a redeploy and new vaults.
- `strategyAssignment` now also represents the workflow (`deployedAt`, unique per strategy and requirement); added `Trade`.
- Workflow job is now `{requirement_id, strategy_id}`: the engine creates the assignment, deploys `workflow-<assignmentId>` and marks the requirement MATCHED. "Strategized" shows only once deployed. Matching itself isn't built, so nothing enqueues jobs yet.
- Added `workflow-engine/src/indexer.ts`: polls finalized `TradeClosed` logs into `Trade`. Capital isn't separated between requirements yet.

Show P&L on the requirements list
- Strategized requirements show realized P&L after commission per token (`components/requirement-pnl.tsx`, `lib/pnl.ts`), with symbol and decimals read from the token contract.
- Applied the contract to the DB with `prisma db update`, fixing the Invest page crash on `deployedAt`; this also dropped the unused `Strategy.isValidated`.

Build subgraph URLs instead of reading them from env
- `workflow-engine/src/config.ts` picks the subgraph by chain and Uniswap version (`SUBGRAPH_IDS`); removed the `SUBGRAPH_URL_*` env vars. Checked each ID live with the engine's queries. v4 on Sepolia has no known subgraph and fails with a clear error. Replaced the Ethereum v4 ID, whose indexers all failed with indexing errors, with a healthy deployment (`EzLH76…`). `resolvePool` now checks a v4 pool's key against its pool ID, because subgraphs can report a dynamic-fee pool's current fee instead of the key's flag.

Enable Ethereum mainnet for investors
- Added the deployed mainnet `VaultDeployer` and `CommissionManager` to `lib/contracts.ts`; vault creation, the vault page and requirement posting all follow that map.
- Replaced `SEPOLIA_RPC_URL` with per-chain `RPC_URLS` (optional `NEXT_PUBLIC_MAINNET_RPC_URL`), because viem's default mainnet RPC rate limits and a failed read breaks the investor pages.
- Added `INDEXER_START_BLOCK_ETHEREUM`, without which the indexer won't start.

MCP server for agents to post investor requirements
- `POST /api/mcp`: stateless MCP endpoint (`@modelcontextprotocol/sdk`) with one tool, `post_investor_requirement`. The investor comes from the access token, never from tool input.
- Moved the posting logic into `lib/post-requirement.ts`, used by both the web route and the tool.
- Agents authenticate with OAuth (PKCE, dynamic registration, `.well-known` metadata, `lib/oauth.ts`): the MCP client opens `/oauth/authorize`, where the investor logs in and approves with a wallet signature.
- Codes (5 min, single use) and access tokens (30 days) are stored hashed in Redis (`lib/mcp-tokens.ts`), so there is no schema change. "Connect agent" on the Invest page shows the server URL and disconnects all agents.
- Added `APP_DOMAIN` to `allowedDevOrigins`, because `next dev` behind a tunnel blocked its dev resources and the authorize page never became interactive; the login form also keeps the OAuth params if submitted before hydration.
- Note: `prisma db update` wants to drop the match engine's `idx_strategy_matching`, which isn't in the contract.

Navbar menus and documentation pages
- Made the navbar taller and wider, and moved its mobile breakpoint to `xl` so the longer labels fit; the links now come from `content/docs.ts`. Updated the `65px` header offsets to `73px`.
- Added `(docs)` routes: `/how-it-works`, `/investor-guide`, `/strategist-guide`, `/mcp-server-guide`

Support the Sepolia, Ethereum and Base deployments across the app
- Checked the given addresses against the broadcast files and on-chain code. Sepolia and Ethereum were already wired up.
- Added Base's `VaultDeployer`, `CommissionManager` and RPC (optional `NEXT_PUBLIC_BASE_RPC_URL`) to `lib/contracts.ts` and `wagmi.ts`; vault creation, the vault page and requirement posting follow those maps.
- Added `RPC_URL_BASE`, `COMMISSION_MANAGER_BASE` and `INDEXER_START_BLOCK_BASE` to the workflow engine's env; `src/config.ts` already handled Base.
- Updated the docs. Removed Arbitrum, which has no contracts, from the frontend and workflow engine (no saved data used it); the match and backtest engines never referenced it.

Fix "Invalid signature" on login
- The server only accepted SIWE messages for `APP_DOMAIN`, so opening the app on any other host, such as localhost with `APP_DOMAIN` set to the tunnel, failed with this error even though the signature was valid.
- `lib/siwe.ts` now checks the domain for login and agent approval: `APP_DOMAIN` only in production, plus localhost in development. A wrong host gets its own error naming the right one.




