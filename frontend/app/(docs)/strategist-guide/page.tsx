import type { Metadata } from "next";
import Link from "next/link";
import { Callout, DocPage, Screenshot } from "@/components/docs";

export const metadata: Metadata = {
  title: "Strategist guide",
  description: "Build a trading strategy in the StratPool builder, publish it and earn commission on profitable trades.",
};

export default function StrategistGuidePage() {
  return (
    <DocPage
      href="/strategist-guide"
      title="Strategist guide"
      lead="Build a strategy on a visual canvas, say where it runs and what it accepts, then publish it. You earn commission when trades that use it make a profit, and investors never see your logic."
      sections={[
        {
          id: "before-you-start",
          title: "Before you start",
          body: (
            <>
              <p>
                <Link href="/sign-up">Create an account</Link> with your wallet. That wallet receives your commission, so use one you control long term. Then open{" "}
                <Link href="/strategies/create">Create strategy</Link>.
              </p>
              {/* IMAGE: add public/img/docs/builder-empty.png. Page /strategies/create with nothing on the canvas and the Strategy details panel showing. */}
              <Screenshot src="/img/docs/builder-empty.png" alt="The empty strategy builder with a node library on the left, a canvas in the middle and strategy details on the right" caption="The builder: node library, canvas and details panel." />
            </>
          ),
        },
        {
          id: "blocks",
          title: "1. Learn the blocks",
          body: (
            <>
              <p>A flow always reads left to right, from a trigger to an action.</p>
              <table>
                <thead>
                  <tr>
                    <th>Block</th>
                    <th>What it does</th>
                    <th>Options</th>
                    <th>Connects to</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Trigger</td>
                    <td>Sets how often the flow runs.</td>
                    <td>1m, 5m, 15m, 1h, 4h, 1d</td>
                    <td>Indicator</td>
                  </tr>
                  <tr>
                    <td>Indicator</td>
                    <td>Reads a market value.</td>
                    <td>RSI, SMA or EMA, period 1 to 500, timeframe</td>
                    <td>Condition</td>
                  </tr>
                  <tr>
                    <td>Condition</td>
                    <td>Compares a reading with a fixed value or a second indicator.</td>
                    <td>Greater than, less than, crosses above, crosses below</td>
                    <td>Logic or Action</td>
                  </tr>
                  <tr>
                    <td>Logic</td>
                    <td>Combines two or more results. Optional.</td>
                    <td>AND, OR</td>
                    <td>Logic or Action</td>
                  </tr>
                  <tr>
                    <td>Action</td>
                    <td>Ends the flow with a trade decision.</td>
                    <td>Buy or Sell with a % of capital, or Hold</td>
                    <td>Nothing</td>
                  </tr>
                </tbody>
              </table>
            </>
          ),
        },
        {
          id: "build",
          title: "2. Build your flow",
          body: (
            <>
              <ol>
                <li>Drag blocks from the library onto the canvas, or click one to add it.</li>
                <li>Draw connections from a block&apos;s right handle to the next block&apos;s left handle. The builder only allows valid connections, and no loops.</li>
                <li>Select a block to set its options in the right panel.</li>
                <li>To remove a block or connection, select it and press Delete, or use the button in the panel.</li>
              </ol>
              {/* IMAGE: add public/img/docs/builder-flow.png. Builder with this flow: Every 1h trigger -> RSI(14), EMA(20), SMA(50); RSI < 30 and EMA crosses above SMA (inputs A and B) -> AND -> BUY 50%. */}
              <Screenshot src="/img/docs/builder-flow.png" alt="A finished flow where RSI below 30 and EMA crossing above SMA feed an AND block that buys with 50 percent of capital" caption="This flow buys with 100% of capital when SMA(9) crosses SMA(21) and sells 100% of capital when SMA(9) crosses below SMA(21)." />
              {/* IMAGE: add public/img/docs/builder-node.png. Same flow as builder-flow.png with the RSI(14) block selected, so the right panel shows its options. */}
              <Screenshot src="/img/docs/builder-empty-og.png" alt="The RSI block selected on the canvas with its indicator, period and timeframe options in the right panel" caption="Selecting a block opens its options." />
              <Callout title="Comparing two indicators">
                Set a condition&apos;s <strong>Compare to</strong> option to <strong>Another indicator</strong>. It gains inputs A and B. Connect one indicator to each.
              </Callout>
            </>
          ),
        },
        {
          id: "details",
          title: "3. Add the strategy details",
          body: (
            <>
              <p>Name the strategy in the top bar. Click an empty part of the canvas to bring back the details panel, then fill it in.</p>
              <div className="mx-auto max-w-[360px]">
                {/* IMAGE: add public/img/docs/builder-details.png. Crop of the builder's right panel only, filled in: Ethereum, SPOT, ETH/USDC, UNISWAP_V3, a pool address, USDC min 100 max 10000, MEDIUM. */}
                <Screenshot src="/img/docs/builder-details.png" alt="The strategy details panel with description, chain, trading type, pair, protocol, pool address, accepted assets and risk level" caption="The details panel, with example values." />
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Description</td>
                    <td>Investors see this, so explain the approach without giving away the logic. Up to 2,000 characters.</td>
                  </tr>
                  <tr>
                    <td>Chain and trading type</td>
                    <td>Where it runs. Choose SPOT for a strategy that can be automated today.</td>
                  </tr>
                  <tr>
                    <td>Trading pair</td>
                    <td>The exact pair, such as ETH/USDC.</td>
                  </tr>
                  <tr>
                    <td>Protocol</td>
                    <td>UNISWAP_V3 or UNISWAP_V4 are the protocols that can be automated.</td>
                  </tr>
                  <tr>
                    <td>Pool address</td>
                    <td>Optional for saving, but automation needs it: a v3 pool address (40 hex characters) or a v4 pool ID (64 hex characters).</td>
                  </tr>
                  <tr>
                    <td>Accepted assets</td>
                    <td>Each token you accept, with a minimum and an optional maximum investment. The token must exist on your chain.</td>
                  </tr>
                  <tr>
                    <td>Risk level</td>
                    <td>LOW, MEDIUM or HIGH.</td>
                  </tr>
                </tbody>
              </table>
            </>
          ),
        },
        {
          id: "publish",
          title: "4. Save or publish",
          body: (
            <>
              <p>
                Select <strong>Save as Draft</strong> to keep working later, or <strong>Publish</strong> to make it available. Both check the flow and details first and list anything to fix.
              </p>
              {/* IMAGE: add public/img/docs/builder-errors.png. Page /strategies/create after selecting Publish on an empty canvas, with the red error list showing. */}
              <Screenshot src="/img/docs/builder-errors.png" alt="The builder showing a red list of validation errors above an empty canvas" caption="Validation errors appear above the canvas." />
              <p>
                Exact duplicates aren&apos;t allowed, but you can publish the same logic for a different pair or pool. Your flow stays private: it&apos;s never shown to investors or returned by
                public APIs.
              </p>
            </>
          ),
        },
        {
          id: "manage",
          title: "5. Manage your strategies",
          body: (
            <>
              <p>
                <Link href="/strategies/my">My strategies</Link> lists your drafts and published strategies. From each card you can edit, publish or take it down, and delete it.
              </p>
              {/* IMAGE: add public/img/docs/my-strategies.png. Page /strategies/my with one Published + Verified strategy and one Draft + Not verified strategy, including their action buttons. */}
              <Screenshot src="/img/docs/my-strategies.png" alt="Two strategy cards, one published and verified, one a draft and not verified, each with action buttons" caption="Values shown are examples." />
              <table>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>What it means</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Draft</td>
                    <td>Only you can see it. It can&apos;t be matched.</td>
                  </tr>
                  <tr>
                    <td>Published</td>
                    <td>Available for matching once verified.</td>
                  </tr>
                  <tr>
                    <td>Not verified</td>
                    <td>Hasn&apos;t passed verification yet, so automation won&apos;t deploy it.</td>
                  </tr>
                  <tr>
                    <td>Verified</td>
                    <td>Passed verification. Published and verified strategies can be deployed.</td>
                  </tr>
                </tbody>
              </table>
            </>
          ),
        },
        {
          id: "earnings",
          title: "6. Earn commission",
          body: (
            <>
              <p>
                You earn <strong>10% of realized profit</strong> each time a trade using your strategy closes a position at a profit. It&apos;s paid on-chain to your account&apos;s wallet, in the
                token received. Losing trades pay nothing, and a loss isn&apos;t carried into later trades.
              </p>
              <p>
                See the worked example in <Link href="/how-it-works#commission">How it works</Link>.
              </p>
              <Callout title="Tips for a strategy that gets used">
                Keep the description specific, set realistic investment limits and add a pool address, since a strategy can&apos;t be automated without one.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
