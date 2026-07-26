import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }
  
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    return NextResponse.json({ 
      id: user.id, 
      publicMetadata: user.publicMetadata,
      privateMetadata: user.privateMetadata,
      unsafeMetadata: user.unsafeMetadata
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
