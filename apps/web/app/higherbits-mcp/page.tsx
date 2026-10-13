import { Metadata } from "next"
import { HigherBitsMcpPageClient } from "./page.client"

export const metadata: Metadata = {
  title:
    "HigherBits MCP | Search HigherBits.dev Components from Your IDE",
  description:
    "Connect an MCP-compatible coding assistant to search the HigherBits.dev component catalog and retrieve component source.",
  keywords: [
    "Cursor IDE",
    "MCP server",
    "Model Context Protocol",
    "component catalog",
    "React components",
    "Windsurf",
    "Cline",
    "Claude Code",
    "Codex",
    "HigherBits MCP",
  ],
  openGraph: {
    title:
      "HigherBits MCP | Search HigherBits.dev Components from Your IDE",
    description:
      "Connect an MCP-compatible coding assistant to search the HigherBits.dev component catalog and retrieve component source.",
    images: ["/higherbits-mcp-social-card.png"],
    type: "website",
    siteName: "HigherBits.dev",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "HigherBits MCP | Search HigherBits.dev Components from Your IDE",
    description:
      "Connect an MCP-compatible coding assistant to search the HigherBits.dev component catalog and retrieve component source.",
    images: ["/higherbits-mcp-social-card.png"],
  },
}

export default function HigherBitsMcpPage() {
  return <HigherBitsMcpPageClient />
}
