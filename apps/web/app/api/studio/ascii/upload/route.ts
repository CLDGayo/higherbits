import { randomUUID } from "crypto"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"

import { assertOwned } from "@/lib/api/server/artifacts"
import { ARTIFACT_BUCKET } from "@/lib/constants"
import { uploadToR2 } from "@/lib/r2"

/**
 * ASCII source photo upload (Phase 10a, §10a.4).
 *
 * This is the only place in the phase that accepts binary from a browser, so
 * it is the one place that does not get a lazy treatment. Four controls, and
 * two of them already existed:
 *
 * 1. **Authentication.** No session, no upload. `studio_artifacts` runs through
 *    Prisma as `service_role`, so - exactly as G9.5 established for the server
 *    actions - the app layer is the only access control on this path.
 * 2. **Ownership.** `assertOwned` from the artifacts server layer, reused rather
 *    than reimplemented. Without it, any signed-in user could write objects into
 *    a key namespace belonging to someone else's artifact.
 * 3. **The object key is built here, never sent by the client.** It is derived
 *    from the authenticated user id, the owned artifact id, and a random
 *    component. A client-supplied key is a path-traversal and object-overwrite
 *    primitive, and no amount of validating one is as good as not accepting one.
 * 4. **Content type and size**, enforced by `processUploadBuffer` inside
 *    `uploadToR2` - magic-byte sniffing rather than trusting the declared type,
 *    plus a 10MB raster cap. This route narrows that allowlist further to the
 *    three raster formats a character-grid renderer can sample.
 *
 * SVG is deliberately excluded even though `upload-security.ts` supports it:
 * it cannot be meaningfully sampled per-cell, and accepting a markup format
 * here would add an XSS surface for no feature.
 */

/** Shared with the delete sweep in `lib/api/server/artifacts.ts` (P11-D1). */
const BUCKET = ARTIFACT_BUCKET

/** Raster only. `image/gif` is out too - the renderer samples one frame. */
const ALLOWED = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const

const bodySchema = z.object({
  artifactId: z.string().uuid(),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  /** Base64, matching what `uploadToR2` accepts. */
  encodedContent: z.string().min(1),
})

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    // Note what is NOT in this schema: any notion of a destination key. There
    // is nothing for a caller to influence about where the object lands.
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    )
  }

  const { artifactId, contentType, encodedContent } = parsed.data

  try {
    const artifact = await assertOwned(artifactId, userId)
    if (artifact.kind !== "ascii") {
      return NextResponse.json(
        { error: "That artifact is not ASCII art" },
        { status: 400 },
      )
    }
  } catch {
    // Missing and not-yours collapse to one response on purpose: distinguishing
    // them here would let a caller enumerate artifact ids.
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const extension = ALLOWED[contentType]
  const fileKey = `ascii/${userId}/${artifactId}/${randomUUID()}.${extension}`

  try {
    const url = await uploadToR2({
      file: { name: `source.${extension}`, type: contentType, encodedContent },
      fileKey,
      bucketName: BUCKET,
      contentType,
    })

    // The key is what the payload stores; the URL is a convenience for the
    // editor so it does not have to know how a key becomes a URL.
    return NextResponse.json({ key: fileKey, url })
  } catch (error) {
    // processUploadBuffer throws for a magic-byte mismatch or an oversized
    // buffer. Both are the client's fault, so both are a 400 rather than a 500.
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
