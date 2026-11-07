import type { Metadata } from "next";
import Link from "next/link";
import { Callout, DocPage, Flow, Screenshot } from "@/components/docs";

export const metadata: Metadata = {
  title: "MCP server guide",
  description: "Connect an AI agent to StratPool over MCP so it can post investment requirements for you.",
};

const config = `{
  "mcpServers": {
    "stratpool": {
      "type": "http",
      "url": "https://<your-stratpool-domain>/api/mcp"
    }
  }
}`;

const toolCall = `{
  "amount": "2500",
  "asset": "USDC",
  "chain": "SEPOLIA",
  "tradingType": "SPOT",
  "tradingPairs": ["ETH/USDC"],
  "riskLevel": "MEDIUM",
  "durationType": "FIXED",
  "durationValue": 3,
  "durationUnit": "MONTHS"
}`;

export default function McpServerGuidePage() {
  return (
    <DocPage
      href="/mcp-server-guide"
      title="MCP server guide"
      lead="StratPool has a Model Context Protocol (MCP) server, so an AI agent can post investment requirements for you. You approve each agent with your wallet and can disconnect it at any time."
      sections={[
        {
          id: "what-it-can-do",
          title: "What an agent can do",
          body: (
            <>
              <table>
                <thead>
                  <tr>
                    <th>An agent can</th>
                    <th>An agent can&apos;t</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Post investment requirements as you, using the same rules as the web form.</td>
                    <td>Withdraw your funds, see your strategies or act for any other account.</td>
                  </tr>
                </tbody>
              </table>
              <Callout type="warning" title="A posted requirement can lead to real trades">
                A matched requirement can start automated trading with the funds in your vault. Ask your agent to confirm the details with you before it posts.
              </Callout>
            </>
          ),
        },
        {
          id: "before-you-start",
          title: "Before you start",
          body: (
            <ul>
              <li>A StratPool account and the wallet linked to it.</li>
              <li>An MCP client that supports remote HTTP servers and OAuth.</li>
            </ul>
          ),
        },
        {
          id: "add-server",
          title: "1. Add the server to your client",
          body: (
            <>
              <p>
                In your dashboard, open the <strong>Invest</strong> page and select <strong>Connect agent</strong>. The dialog shows the configuration with the correct server URL.
              </p>
              {/* IMAGE: add public/img/docs/connect-agent.png. Invest page with the Connect an AI agent dialog open, after selecting Connect agent. */}
              <Screenshot src="/img/docs/connect-agent.png" alt="The Connect an AI agent dialog showing the MCP server configuration as JSON" caption="Copy the configuration from the Connect agent dialog." />
              <p>Add it to your MCP client. Most clients use this format:</p>
              <pre>
                <code>{config}</code>
              </pre>
            </>
          ),
        },
        {
          id: "approve",
          title: "2. Log in and approve",
          body: (
            <>
              <p>The first time the agent connects, your client opens a StratPool page in your browser. No API key is needed.</p>
              <Flow
                caption="How an agent gets access"
                steps={[
                  { title: "Connect", text: "The client calls the server and is told to sign in." },
                  { title: "Log in", text: "You log in to StratPool in your browser." },
                  { title: "Approve", text: "You sign an approval message with your wallet." },
                  { title: "Return", text: "The client receives a token for your account." },
                ]}
              />
              <ol>
                <li>If you aren&apos;t logged in, enter your email and select <strong>Continue</strong>, then connect your wallet.</li>
                <li>Read what the agent is asking for, and check the name and the site it will return to.</li>
                <li>Select <strong>Approve with wallet</strong> and sign the message, or select <strong>Deny</strong> to refuse.</li>
              </ol>
              {/* IMAGE: add public/img/docs/agent-login.png. Page /oauth/authorize opened by an MCP client while logged out, showing the Log in card that names the agent. */}
              <Screenshot src="/img/docs/agent-login.png" alt="The log in page naming the agent that is asking to connect" caption="Log in first if you aren't already." />
              {/* IMAGE: add public/img/docs/agent-approve.png. Page /oauth/authorize opened by an MCP client while logged in, showing Connect <agent>, the Deny link and the approve button. */}
              <Screenshot src="/img/docs/agent-approve.png" alt="The Connect agent page explaining what the agent can do, with a Deny link and an approve button" caption="The approval page explains what the agent will be able to do." />
              <p>Signing is free and sends no transaction. Your browser then returns to your client.</p>
            </>
          ),
        },
        {
          id: "post",
          title: "3. Post a requirement",
          body: (
            <>
              <p>Ask your agent in plain language, for example:</p>
              <blockquote>Post a StratPool requirement for 2500 USDC on Sepolia, spot ETH/USDC, medium risk, for 3 months.</blockquote>
              <p>
                The agent calls the <code>post_investor_requirement</code> tool. The account always comes from the agent&apos;s access token, never from the tool&apos;s input.
              </p>
              <pre>
                <code>{toolCall}</code>
              </pre>
              <p>
                The requirement appears on your Invest page like any other. For what happens next, see <Link href="/investor-guide#track-results">Track your results</Link>.
              </p>
            </>
          ),
        },
        {
          id: "reference",
          title: "Tool reference",
          body: (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Rules</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>amount</code></td>
                    <td>string</td>
                    <td>Whole tokens as a decimal above 0, such as &quot;100.5&quot;.</td>
                  </tr>
                  <tr>
                    <td><code>asset</code></td>
                    <td>string</td>
                    <td>A token symbol that exists on the chain, such as &quot;USDC&quot;.</td>
                  </tr>
                  <tr>
                    <td><code>chain</code></td>
                    <td>enum</td>
                    <td>ETHEREUM, BASE or SEPOLIA.</td>
                  </tr>
                  <tr>
                    <td><code>tradingType</code></td>
                    <td>enum</td>
                    <td>SPOT or PERPETUALS.</td>
                  </tr>
                  <tr>
                    <td><code>tradingPairs</code></td>
                    <td>string[]</td>
                    <td>1 to 20 pairs, such as &quot;ETH/USDC&quot;.</td>
                  </tr>
                  <tr>
                    <td><code>riskLevel</code></td>
                    <td>enum</td>
                    <td>LOW, MEDIUM or HIGH.</td>
                  </tr>
                  <tr>
                    <td><code>durationType</code></td>
                    <td>enum</td>
                    <td>FIXED or FLEXIBLE.</td>
                  </tr>
                  <tr>
                    <td><code>durationValue</code></td>
                    <td>integer</td>
                    <td>1 to 3650. Required when FIXED.</td>
                  </tr>
                  <tr>
                    <td><code>durationUnit</code></td>
                    <td>enum</td>
                    <td>DAYS or MONTHS. Required when FIXED.</td>
                  </tr>
                </tbody>
              </table>
              <p>On success the tool returns the created requirement, with <code>amount</code> in the token&apos;s base units.</p>
            </>
          ),
        },
        {
          id: "disconnect",
          title: "Access and disconnecting",
          body: (
            <>
              <p>Agent access lasts 30 days. After that, your client asks you to approve it again.</p>
              <p>
                To cut off access sooner, open <strong>Invest</strong>, select <strong>Agent connected</strong>, then <strong>Disconnect all agents</strong>. This removes every connected agent at once.
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
                  <td>Invalid or revoked token</td>
                  <td>Access expired or was disconnected. Reconnect the server in your client and approve again.</td>
                </tr>
                <tr>
                  <td>Can&apos;t connect this agent</td>
                  <td>The client&apos;s request was invalid. Remove the server, add it again and retry.</td>
                </tr>
                <tr>
                  <td>No token with symbol … exists</td>
                  <td>The asset isn&apos;t available on that chain. Check the symbol and chain.</td>
                </tr>
                <tr>
                  <td>A fixed duration needs a length and a unit</td>
                  <td>Include <code>durationValue</code> and <code>durationUnit</code>, or use FLEXIBLE.</td>
                </tr>
              </tbody>
            </table>
          ),
        },
      ]}
    />
  );
}
