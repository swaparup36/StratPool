import type { Metadata } from "next";
import Link from "next/link";
import { Callout, DocPage, Flow, Screenshot } from "@/components/docs";
import { MatchMock } from "@/components/mocks";

export const metadata: Metadata = {
  title: "How it works",
  description: "How StratPool connects strategists and investors, from a published strategy to automated, on-chain execution.",
};

export default function HowItWorksPage() {
  return (
    <DocPage
      href="/how-it-works"
      title="How StratPool works"
      lead="StratPool connects people who build trading strategies with people who provide capital. Strategists publish the logic, investors state what they want, and automation runs the matched strategy on funds in the investor's own vault."
      sections={[
        {
          id: "overview",
          title: "Overview",
          body: (
            <>
              <p>There are two sides to the marketplace, and each keeps something private:</p>
              <ul>
                <li>
                  <strong>Strategists</strong> keep their logic. Investors see a strategy&apos;s description and metrics, never its internal flow.
                </li>
                <li>
                  <strong>Investors</strong> keep custody. Funds stay in a vault that only the investor&apos;s wallet can withdraw from.
                </li>
              </ul>
              <Flow
                caption="The path from a published strategy to an automated trade"
                steps={[
                  { title: "Publish", text: "A strategist builds a flow and publishes it." },
                  { title: "Verify", text: "The strategy is checked before it can be used." },
                  { title: "Require", text: "An investor funds a vault and posts a requirement." },
                  { title: "Match", text: "The requirement is paired with a suitable strategy." },
                  { title: "Automate", text: "A Chainlink workflow trades on the strategy's signals." },
                ]}
              />
            </>
          ),
        },
        {
          id: "strategies",
          title: "Strategies",
          body: (
            <>
              <p>
                A strategy is a flow of connected blocks: a trigger starts it, indicators read the market, conditions test those readings, and an action buys, sells or holds. Strategists
                also set where it runs (chain, pair, protocol and pool) and which assets it accepts.
              </p>
              {/* IMAGE: add public/img/docs/builder-flow.png. Builder with this flow: Every 1h trigger -> RSI(14), EMA(20), SMA(50); RSI < 30 and EMA crosses above SMA (inputs A and B) -> AND -> BUY 50%. */}
              <Screenshot src="/img/docs/builder-flow.png" alt="The strategy builder showing a flow from a trigger through indicators and conditions to a buy action" caption="A strategy in the builder. Investors never see this view." />
              <p>
                Read the <Link href="/strategist-guide">Strategist guide</Link> to build one.
              </p>
            </>
          ),
        },
        {
          id: "vaults",
          title: "Vaults",
          body: (
            <>
              <p>
                Each investor gets their own vault contract on each chain they use. Deposits go there rather than to a shared pool. Only the investor&apos;s wallet can deposit or withdraw,
                and automation can only swap inside the vault through the configured router.
              </p>
              {/* IMAGE: add public/img/docs/vault.png. Vault page /investors/<vault>/dashboard with ETH and USDC listed, ideally with some Locked commission. Include the sidebar and both forms. */}
              <Screenshot src="/img/docs/vault.png" alt="The vault page listing ETH and USDC balances with deposit and withdraw controls" caption="The vault page. Values shown are examples." />
            </>
          ),
        },
        {
          id: "matching",
          title: "Requirements and matching",
          body: (
            <>
              <p>
                An investor describes what they want: amount, asset, chain, trading type, pairs, risk level and duration. StratPool compares that requirement with published, verified
                strategies and looks for a compatible one.
              </p>
              <MatchMock />
              <p>Once a workflow is deployed for a requirement, it shows as <strong>Strategized</strong> and its results appear on the Invest page.</p>
              {/* IMAGE: add public/img/docs/requirements.png. Invest page /investors/<vault>/dashboard/invest with one Matched + Strategized requirement showing Realized P&L, and one Open requirement. */}
              <Screenshot src="/img/docs/requirements.png" alt="The Invest page listing one matched requirement with realized profit and one open requirement" caption="Requirements on the Invest page. Values shown are examples." />
            </>
          ),
        },
        {
          id: "execution",
          title: "Automated execution",
          body: (
            <>
              <p>
                Each match gets its own Chainlink CRE workflow. It evaluates the strategy on schedule and, when the conditions are met, sends a signed report to StratPool&apos;s{" "}
                <code>CommissionManager</code> contract, which checks where the report came from and tells the vault to make the swap.
              </p>
              <Flow
                caption="What happens each time a strategy fires"
                steps={[
                  { title: "Evaluate", text: "The workflow reads market data and runs the strategy." },
                  { title: "Report", text: "A signed report goes to the CommissionManager." },
                  { title: "Swap", text: "The vault swaps its own funds with a minimum output." },
                  { title: "Account", text: "Closed positions record profit or loss on-chain." },
                ]}
              />
            </>
          ),
        },
        {
          id: "commission",
          title: "Commission",
          body: (
            <>
              <p>
                Strategists are paid only for profit. When a trade closes a position at a profit, <strong>10% of the realized profit</strong> goes to the strategist, in the token received. A
                loss pays nothing and isn&apos;t carried into later trades.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Position cost</th>
                    <th>Proceeds</th>
                    <th>Profit</th>
                    <th>Commission</th>
                    <th>Investor keeps</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1,000 USDC</td>
                    <td>1,200 USDC</td>
                    <td>200 USDC</td>
                    <td>20 USDC</td>
                    <td>1,180 USDC</td>
                  </tr>
                  <tr>
                    <td>1,000 USDC</td>
                    <td>900 USDC</td>
                    <td>-100 USDC</td>
                    <td>None</td>
                    <td>900 USDC</td>
                  </tr>
                </tbody>
              </table>
              <p>
                If a payment can&apos;t reach the strategist, the investor&apos;s trade still goes through. That amount stays locked in the vault for later settlement and shows under{" "}
                <strong>Locked commission</strong>.
              </p>
            </>
          ),
        },
        {
          id: "availability",
          title: "Current availability",
          body: (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Area</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Vaults</td>
                    <td>Ethereum, Base and Sepolia.</td>
                  </tr>
                  <tr>
                    <td>Automated trading</td>
                    <td>Spot strategies on Uniswap v3 and v4 pools. Perpetuals can be selected but can&apos;t be automated yet.</td>
                  </tr>
                  <tr>
                    <td>Automatic matching and ratings</td>
                    <td>Being rolled out. Until a match is made, a requirement stays <strong>Open</strong>.</td>
                  </tr>
                </tbody>
              </table>
              <Callout type="warning" title="Trading carries risk">
                You can lose some or all of your deposit. A strategy&apos;s past results don&apos;t guarantee future performance. Try the flow on Sepolia before using real funds.
              </Callout>
            </>
          ),
        },
      ]}
    />
  );
}
