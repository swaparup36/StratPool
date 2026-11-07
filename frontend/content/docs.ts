import type { IconName } from "@/components/icon";

// Shared by the navbar, the docs sidebar and each guide's previous/next links.
export const DOC_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/how-it-works", label: "How it works", icon: "layers" },
  { href: "/investor-guide", label: "Investor guide", icon: "target" },
  { href: "/strategist-guide", label: "Strategist guide", icon: "zap" },
  { href: "/mcp-server-guide", label: "MCP server guide", icon: "file" },
];
