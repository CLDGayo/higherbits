import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("================= SANDBOX ERROR LOG =================")
    console.log(body)
    console.log("=====================================================")
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false })
  }
}
