import "server-only"
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/**
 * Credentialed READ access to R2, for source files behind the paywall.
 *
 * This deliberately lives OUTSIDE lib/r2.ts. That file is "use server", which
 * makes every export a browser-callable RPC; a read helper there would let any
 * caller mint signed URLs for arbitrary keys. `server-only` makes importing
 * this from a client component a compile-time failure instead.
 *
 * Callers must do their own entitlement check first — this module signs what it
 * is asked to sign and makes no authorization decision of its own.
 */

export const SOURCE_PREFIX = "src/"
const SOURCE_BUCKET = "components-code"

const cdnBase = () => (process.env.NEXT_PUBLIC_CDN_URL ?? "").replace(/\/+$/, "")

let client: S3Client | null = null
const r2 = () => {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    })
  }
  return client
}

/** Maps a stored CDN URL back to its bucket key, or null if it is not one. */
export const cdnUrlToKey = (url: string): string | null => {
  const base = cdnBase()
  if (!base || !url.startsWith(`${base}/`)) return null
  const key = url.slice(base.length + 1)
  return key.length > 0 ? key : null
}

/** True for keys that must never be publicly readable once the CDN rule lands. */
export const isPrivateSourceKey = (key: string) => key.startsWith(SOURCE_PREFIX)

export const getSignedR2ReadUrl = async ({
  fileKey,
  bucketName = SOURCE_BUCKET,
  expiresIn = 300,
}: {
  fileKey: string
  bucketName?: string
  expiresIn?: number
}): Promise<string> =>
  getSignedUrl(
    r2(),
    new GetObjectCommand({ Bucket: bucketName, Key: fileKey }),
    { expiresIn },
  )

/**
 * Reads component source by its stored URL.
 *
 * Signs the request when the object lives under the private source prefix;
 * falls back to a plain fetch otherwise, so components published before the
 * prefix change keep resolving. Both paths work whether or not the CDN is
 * already refusing `src/`, which is what lets the ops change ship with no
 * downtime and no migration.
 */
export const fetchComponentSource = async (
  url: string,
): Promise<{ data: string | null; error: Error | null }> => {
  try {
    const key = cdnUrlToKey(url)
    const target =
      key && isPrivateSourceKey(key)
        ? await getSignedR2ReadUrl({ fileKey: key })
        : url

    const response = await fetch(target)
    if (!response.ok) {
      return {
        data: null,
        error: new Error(`R2 read failed (${response.status}) for ${url}`),
      }
    }
    return { data: await response.text(), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}
