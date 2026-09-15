import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { checkIsAdmin } from "@/lib/admin"

export default async function ContestLayout({
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
