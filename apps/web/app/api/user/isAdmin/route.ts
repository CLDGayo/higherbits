import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { checkIsAdmin } from "@/lib/admin"

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ isAdmin: false }, { status: 401 })
  }

  try {
    const { isAdmin, error } = await checkIsAdmin(userId)

    if (error) {
      console.error("Error fetching admin status in route:", error)
    }

    return NextResponse.json({ isAdmin: isAdmin ?? false })
  } catch (error) {
    console.error("Error in GET /api/user/isAdmin:", error)
    return NextResponse.json({ isAdmin: false })
  }
}
