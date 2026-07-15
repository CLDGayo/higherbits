import { type Metadata } from "next/types"

export const metadata: Metadata = {
  title: "HigherBits AI",
  description: "AI Agent for Your IDE That Creates Professional UI Components",
}

export default function MagicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
