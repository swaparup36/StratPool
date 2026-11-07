import type { Metadata } from "next";
import Link from "next/link";
import { Callout, DocPage, Screenshot } from "@/components/docs";

export const metadata: Metadata = {
  title: "Investor guide",
  description: "Create a StratPool account and vault, deposit funds, post an investment requirement and track your results.",
};

export default function InvestorGuidePage() {
  return (
    <DocPage
      href="/investor-guide"
      title="Investor guide"
      lead="Go from a new account to a live requirement: sign up with your wallet, create a vault, deposit funds and tell StratPool what you want to trade."
      sections={[
        {
          id: "before-you-start",
          title: "Before you start",
          body: (
            <ul>
              <li>A browser wallet, or a mobile wallet that supports WalletConnect.</li>
              <li>Native tokens to pay gas on the chain you choose.</li>
              <li>
                Funds on that chain. Vaults are available on Ethereum, Base and the Sepolia testnet, which is the safest place to try the flow first.
              </li>
            </ul>
          ),
        },
        {
          id: "create-account",
          title: "1. Create your account",
          body: (
            <>
              <ol>
                <li>
                  Open <Link href="/sign-up">Sign up</Link> and enter your first name, last name and email.
                </li>
                <li>Select <strong>Continue</strong>.</li>
                <li>Choose your wallet, then sign the message it shows. Signing is free and sends no transaction.</li>
              </ol>
              {/* IMAGE: add public/img/docs/sign-up.png. Page /sign-up, logged out, with first name, last name and email filled in. Include the navbar. */}
              <Screenshot src="/img/docs/sign-up.png" alt="The Create your account form with name and email fields" caption="Enter your details, then select Continue." />
              {/* IMAGE: add public/img/docs/connect-wallet.png. Page /sign-up after selecting Continue, with the wallet connection dialog open. */}
              <Screenshot src="/img/docs/connect-wallet.png" alt="The wallet connection dialog listing available wallets" caption="Choose the wallet that will own your account and vault." />
              <Callout title="Your wallet is your login">
                Your account is tied to this wallet address. Use the same wallet each time you log in, because the vault only accepts it.
              </Callout>
            </>
          ),
        },
        {
          id: "create-vault",
          title: "2. Create your vault",
          body: (
            <>
              <p>Your vault is a smart contract that holds your deposits and belongs only to your wallet.</p>
              <ol>
                <li>
                  Go to the home page and select <strong>Invest</strong>. If you have no vault on the current chain, you&apos;ll land on the Create your vault page.
                </li>
                <li>Pick a network with the selector in the navbar.</li>
                <li>Select <strong>Create vault</strong> and confirm the transaction in your wallet. This costs gas.</li>
              </ol>
              {/* IMAGE: add public/img/docs/create-vault.png. Page /investors/create-vault with no wallet connected, so the card shows the Connect wallet button. */}
              <Screenshot src="/img/docs/create-vault.png" alt="The Create your vault card with a Connect wallet button" caption="Vault creation takes one transaction." />
              <p>You get one vault per chain. Switching network in the navbar takes you to your vault on that chain.</p>
            </>
          ),
        },
        {
          id: "deposit",
          title: "3. Deposit funds",
          body: (
            <>
              <ol>
                <li>Open the <strong>Vault</strong> page in your dashboard.</li>
                <li>
                  To use an ERC-20 token such as USDC, type its symbol under <strong>Add an ERC-20 token</strong> and select <strong>Add</strong>. ETH is always listed.
                </li>
                <li>Select <strong>Deposit</strong>, choose the asset and enter an amount.</li>
                <li>Confirm in your wallet. ERC-20 tokens need an approval transaction before the deposit.</li>
              </ol>
              {/* IMAGE: add public/img/docs/vault.png. Vault page /investors/<vault>/dashboard with ETH and USDC listed, ideally with some Locked commission. Include the sidebar and both forms. */}
              <Screenshot src="/img/docs/vault.png" alt="The vault page with a balances table, deposit form and add token form" caption="Balances, deposit and withdraw controls. Values shown are examples." />
              <table>
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>What it means</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>In vault</td>
                    <td>The vault&apos;s total balance of this token.</td>
                  </tr>
                  <tr>
                    <td>Locked commission</td>
                    <td>Commission owed to a strategist that hasn&apos;t been paid out yet.</td>
                  </tr>
                  <tr>
                    <td>Withdrawable</td>
                    <td>In vault minus locked commission.</td>
                  </tr>
                  <tr>
                    <td>In wallet</td>
                    <td>What your connected wallet holds, available to deposit.</td>
                  </tr>
                </tbody>
              </table>
              <Callout title="Added tokens are remembered per browser">
                Your funds are safe on-chain, but on a new device you&apos;ll need to add the token again to see it.
              </Callout>
            </>
          ),
        },
        {
          id: "post-requirement",
          title: "4. Post a requirement",
          body: (
            <>
              <p>
                On the <strong>Invest</strong> page, select <strong>Post requirement</strong> and fill in the form.
              </p>
              {/* IMAGE: add public/img/docs/post-requirement.png. Invest page, Post requirement dialog open and filled in: 2500 USDC, ETH/USDC, FIXED, 3 MONTHS. */}
              <Screenshot src="/img/docs/post-requirement.png" alt="The Post a requirement dialog filled in with 2500 USDC, the ETH/USDC pair and a three month duration" caption="An example requirement." />
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>What to enter</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Amount and asset</td>
                    <td>How much to invest and the token symbol, such as 2500 and USDC.</td>
                  </tr>
                  <tr>
                    <td>Chain</td>
                    <td>The chain where your funds are.</td>
                  </tr>
                  <tr>
                    <td>Trading type</td>
                    <td>SPOT or PERPETUALS. Only spot strategies can be automated today.</td>
                  </tr>
                  <tr>
                    <td>Trading pairs</td>
                    <td>One or more pairs separated by commas, such as ETH/USDC, WBTC/USDC.</td>
                  </tr>
                  <tr>
                    <td>Risk level</td>
                    <td>LOW, MEDIUM or HIGH.</td>
                  </tr>
                  <tr>
                    <td>Duration</td>
                    <td>FLEXIBLE, or FIXED with a length in days or months.</td>
                  </tr>
                </tbody>
              </table>
              <Callout type="warning" title="A match can trade your funds">
                Once a strategy is deployed for your requirement, it can trade the funds in your vault automatically. Only post what you&apos;re comfortable having traded.
              </Callout>
              <p>
                If your asset is on another chain, bridge it to the chain you selected and deposit it there first. Prefer to post through an AI assistant? See the{" "}
                <Link href="/mcp-server-guide">MCP server guide</Link>.
              </p>
            </>
          ),
        },
        {
          id: "track-results",
          title: "5. Track your results",
          body: (
            <>
              <p>The Invest page lists your requirements, newest first.</p>
              {/* IMAGE: add public/img/docs/requirements.png. Invest page /investors/<vault>/dashboard/invest with one Matched + Strategized requirement showing Realized P&L, and one Open requirement. */}
              <Screenshot src="/img/docs/requirements.png" alt="Two requirements, one matched and strategized with realized profit, one still open" caption="Values shown are examples." />
              <table>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>What it means</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Open</td>
                    <td>Waiting for a matching strategy.</td>
                  </tr>
                  <tr>
                    <td>Matched</td>
                    <td>A strategy has been assigned.</td>
                  </tr>
                  <tr>
                    <td>Strategized</td>
                    <td>The automation is deployed. Realized P&amp;L appears on the card.</td>
                  </tr>
                  <tr>
                    <td>Closed</td>
                    <td>The requirement has ended.</td>
                  </tr>
                </tbody>
              </table>
              <p>Realized P&amp;L is shown per token, after commission, and only counts closed trades. Open positions aren&apos;t included.</p>
            </>
          ),
        },
        {
          id: "withdraw",
          title: "6. Withdraw",
          body: (
            <>
              <ol>
                <li>Open the <strong>Vault</strong> page and select <strong>Withdraw</strong>.</li>
                <li>Choose the asset and enter an amount up to the <strong>Withdrawable</strong> balance.</li>
                <li>Confirm in your wallet. Funds always go to the wallet that owns the vault.</li>
              </ol>
              <p>
                You can read more about fees and execution in <Link href="/how-it-works#commission">How it works</Link>.
              </p>
            </>
          ),
        },
        {
          id: "troubleshooting",
          title: "Troubleshooting",
          body: (
            <table>
              <thead>
                <tr>
                  <th>You see</th>
                  <th>What to do</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Switch your wallet to 0x…</td>
                  <td>Your connected wallet isn&apos;t the one on your account. Switch to that address.</td>
                </tr>
                <tr>
                  <td>StratPool isn&apos;t available on this network</td>
                  <td>Pick Ethereum, Base or Sepolia in the navbar.</td>
                </tr>
                <tr>
                  <td>No token with symbol … found</td>
                  <td>Check the symbol and that the token exists on the current chain.</td>
                </tr>
                <tr>
                  <td>That&apos;s more than you can withdraw</td>
                  <td>Part of the balance is locked commission. Enter the Withdrawable amount or less.</td>
                </tr>
              </tbody>
            </table>
          ),
        },
      ]}
    />
  );
}
