import { Metadata } from "next"
import { MagicPageClient } from "./page.client"

export const metadata: Metadata = {
  title: "HigherBits AI — HigherBits MCP for your coding assistant",
  description:
    "Search the HigherBits component catalogue and retrieve authorized source from your coding assistant with HigherBits MCP. HigherBits AI provides catalogue retrieval; your connected assistant controls how results are used.",
  keywords: [
    "Cursor IDE",
    "MCP server",
    "component catalogue search",
    "authorized source retrieval",
    "web development",
    "UI components",
    "React components",
    "TypeScript",
    "Next.js",
    "developer tools",
    "HigherBits MCP",
    "Windsurf",
    "MCP",
    "modern component patterns",
  ],
  openGraph: {
    title: "HigherBits AI — HigherBits MCP for your coding assistant",
    description:
      "Search the HigherBits component catalogue and retrieve authorized source from your coding assistant with HigherBits MCP. HigherBits AI provides catalogue retrieval; your connected assistant controls how results are used.",
    images: ["/magic-agent-og-image.png"],
    type: "website",
    siteName: "HigherBits.dev",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "HigherBits AI — HigherBits MCP for your coding assistant",
    description:
      "Search the HigherBits component catalogue and retrieve authorized source from your coding assistant with HigherBits MCP.",
    images: ["/magic-agent-og-image.png"],
  },
}

export default function MagicPage() {
  return <MagicPageClient />
}
