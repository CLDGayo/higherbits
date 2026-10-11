import { type Metadata } from "next/types"

export const metadata: Metadata = {
  title: "HigherBits AI — HigherBits MCP",
  description:
    "Search the HigherBits component catalogue and retrieve authorized source through MCP.",
}

export default async function MagicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The product page is public. Protected child routes enforce their own
  // access rules so the console can serve each signed-in user's account.
  return <>{children}</>
}
