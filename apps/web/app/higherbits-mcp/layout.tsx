import { type Metadata } from "next/types"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { checkIsAdmin } from "@/lib/admin"

export const metadata: Metadata = {
  title: "HigherBits MCP",
  description: "Search the HigherBits.dev component catalog from your coding assistant.",
}

export default async function HigherBitsMcpLayout({
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
