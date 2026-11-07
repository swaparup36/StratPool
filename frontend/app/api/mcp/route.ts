import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { NextResponse } from "next/server";
import { investorForToken } from "@/lib/mcp-tokens";
import { issuer } from "@/lib/oauth";
import { postRequirement } from "@/lib/post-requirement";
import { requirementFields } from "@/lib/requirements";
import { TokenLookupError } from "@/lib/tokens";

const toolError = (message: string) => ({ isError: true, content: [{ type: "text" as const, text: message }] });

// handles POST requests to /api/mcp, which is the endpoint for the MCP client to call when an investor posts a requirement
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  const investorId = token ? await investorForToken(token) : null;
  if (!investorId) {
    // Tells the agent's MCP client where to find the login flow it should send the investor through.
    const metadata = `${issuer()}/.well-known/oauth-protected-resource/api/mcp`;
    return NextResponse.json({ success: false, message: "Invalid or revoked token" }, { status: 401, headers: { "WWW-Authenticate": `Bearer resource_metadata="${metadata}"` } });
  }

  const server = new McpServer({ name: "stratpool", version: "1.0.0" });

  server.registerTool(
    "post_investor_requirement",
    {
      description:
        "Post an investment requirement for the investor who owns this token, then queue it for strategy matching. A match can deploy automation that trades the investor's deposited funds, so only call this with details the investor has confirmed. " +
        "amount is in whole tokens as a decimal string, like \"100.5\". asset is a token symbol, like \"USDC\". tradingPairs look like \"ETH/USDC\". durationValue and durationUnit are required when durationType is FIXED. " +
        "The returned amount is in the token's base units.",
      inputSchema: requirementFields,
    },
    async (input) => {
      try {
        const result = await postRequirement(investorId, input);
        if (!result.ok) return toolError(result.errors.join(". "));
        return { content: [{ type: "text", text: JSON.stringify(result.requirement) }] };
      } catch (error) {
        console.error("Failed to create requirement through MCP", error);
        return toolError(error instanceof TokenLookupError ? error.message : "Internal Server Error");
      }
    }
  );

  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  return transport.handleRequest(req);
}
