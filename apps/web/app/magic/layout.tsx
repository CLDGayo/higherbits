import { type Metadata } from "next/types"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { checkIsAdmin } from "@/lib/admin"

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
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  const { isAdmin } = await checkIsAdmin(userId)
  if (!isAdmin) {
    redirect("/")
  }

  return <>{children}</>
}
