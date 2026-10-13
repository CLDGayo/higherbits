import { NextResponse } from "next/server"
import { COPY_HEADERS, copyErrorResponse } from "@/lib/api/server/copy-admission"
import { copyIdentity } from "@/lib/api/server/copy-identity"
export async function GET(request: Request) {
  try {
    await copyIdentity(request)
    return NextResponse.json({ success: true, message: "API key is valid and active" }, { headers: COPY_HEADERS })
  } catch (error) { return copyErrorResponse(error) }
}
