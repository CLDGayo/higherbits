import { isArtifactKind } from "@/components/features/studio/artifacts/registry"
import { checkIsAdmin } from "./admin"
import { supabaseWithAdminAccess } from "./supabase"

/**
 * Authorization for the R2 server actions in `./r2.ts` (audit blocker B3).
 *
 * `requireUser()` only proves that *a* session exists. Every export of `r2.ts`
 * is a browser-callable RPC that takes a caller-supplied key/prefix, so without
 * this check any signed-in account could overwrite or bulk-delete another
 * creator's objects. This module is deliberately NOT "use server": its exports
 * must never become RPCs themselves.
 *
 * Three real key shapes exist across the app's call sites:
 *   - `{userId}/...`          (edit dialog, publish layout, import route)
 *   - `{username}/...`        (studio submit, incl. admin publish-as)
 *   - `{kind}/{userId}/...`   (studio artifacts: ascii upload, deleteArtifact)
 */

const R2_ALLOWED_BUCKET = "components-code"

/**
 * The identity segments a user may own: their id, plus username and
 * display_username when set. Fails closed - on a lookup error or missing row,
 * only the literal id is accepted.
 */
export async function resolveOwnerSegments(
  userId: string,
): Promise<Set<string>> {
  const segments = new Set<string>([userId])

  const { data, error } = await supabaseWithAdminAccess
    .from("users")
    .select("username, display_username")
    .eq("id", userId)
    .maybeSingle()

  if (error || !data) {
    return segments
  }

  if (data.username) {
    segments.add(data.username)
  }
  // display_username has no DB uniqueness constraint (unlike username) — do not add a new call site that keys a path by it without first verifying uniqueness
  if (data.display_username) {
    segments.add(data.display_username)
  }

  return segments
}

/**
 * Throws unless `pathValue` belongs to `userId` (or the caller is an admin).
 * Admin status is resolved server-side from the session's userId - never from
 * any client-supplied value.
 */
export async function assertOwnsR2Path(
  userId: string,
  pathValue: string,
  bucketName: string,
): Promise<void> {
  // checkIsAdmin (./admin) returns an OBJECT. Destructure it: an object is
  // always truthy, so testing the raw return would make every caller an admin.
  const { isAdmin } = await checkIsAdmin(userId)
  if (isAdmin === true) {
    return
  }

  if (bucketName !== R2_ALLOWED_BUCKET) {
    throw new Error("Unauthorized: unexpected bucket")
  }

  const segments = pathValue.split("/")
  const first = segments[0] ?? ""
  const second = segments[1]
  const ownerSegments = await resolveOwnerSegments(userId)

  // `{kind}/{userId}/...` - the kind must be a member of the closed canonical
  // set, and the second segment is checked against the CALLER's own identity.
  // A kind-prefixed path is decided ONLY here: a user whose username happens
  // to equal a kind (e.g. "ascii") must not reach `ascii/{victimId}/...`
  // through the first-segment check below.
  if (isArtifactKind(first)) {
    if (second !== undefined && ownerSegments.has(second)) {
      return
    }
    throw new Error("Unauthorized: path does not belong to caller")
  }

  if (ownerSegments.has(first)) {
    return
  }

  throw new Error("Unauthorized: path does not belong to caller")
}
