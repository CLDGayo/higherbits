import "server-only"
import prisma from "../../prisma"
import {
  ARTIFACT_KINDS,
  ARTIFACT_STATUSES,
  type ArtifactKind,
  type ArtifactStatus,
  getKindConfig,
} from "@/components/features/studio/artifacts/registry"

/**
 * Kind-agnostic CRUD for studio_artifacts (Phase 09, §6.4).
 *
 * Two rules hold on every mutation here, and neither can move up into the
 * action layer:
 *
 * 1. Ownership is re-checked against the loaded row. Prisma connects as
 *    service_role and `relforcerowsecurity` is false on every table in this
 *    database, so RLS does not apply to this path at all. The policies in
 *    0002_studio_artifacts.sql constrain the browser client only. Here, this
 *    check is the whole control.
 * 2. The payload is parsed against the registry's zod schema for the row's
 *    kind. `payload` is a JSONB column, so an unvalidated write stores whatever
 *    it is handed - a client-side check alone is not a control.
 */

export class ArtifactNotFoundError extends Error {
  constructor() {
    super("Artifact not found")
    this.name = "ArtifactNotFoundError"
  }
}

export class ArtifactForbiddenError extends Error {
  constructor() {
    super("You do not have access to this artifact")
    this.name = "ArtifactForbiddenError"
  }
}

export class ArtifactPayloadError extends Error {
  readonly issues: string[]
  constructor(issues: string[]) {
    super(`Invalid payload: ${issues.join("; ")}`)
    this.name = "ArtifactPayloadError"
    this.issues = issues
  }
}

/**
 * Parses `payload` against the schema the registry declares for `kind`.
 *
 * Returns the parsed value rather than the input, so stored defaults are the
 * ones zod applied. The schemas are `.strict()`, so an unknown key is an error
 * rather than something quietly dropped - without that, every theme field being
 * optional or defaulted meant a gradient payload parsed cleanly as a theme.
 */
export const validatePayload = (kind: ArtifactKind, payload: unknown) => {
  const result = getKindConfig(kind).payloadSchema.safeParse(payload)
  if (!result.success) {
    throw new ArtifactPayloadError(
      result.error.issues.map(
        (issue) =>
          `${issue.path.join(".") || "payload"}: ${issue.message}`,
      ),
    )
  }
  return result.data
}

/**
 * Throws unless the artifact exists and belongs to `userId`.
 *
 * Exported since Phase 10a: the ASCII upload route needs exactly this check
 * before it will write an object into a key namespaced by an artifact id, and a
 * second implementation of "is this yours" is how the two drift apart.
 */
export const assertOwned = async (id: string, userId: string) => {
  const artifact = await prisma.studio_artifacts.findUnique({
    where: { id },
    select: { id: true, user_id: true, kind: true },
  })

  if (!artifact) {
    throw new ArtifactNotFoundError()
  }

  // Deliberately not folded into the findUnique above. Distinguishing "missing"
  // from "not yours" here keeps the error accurate for the owner; the action
  // layer is what decides how much of that reaches a caller.
  if (artifact.user_id !== userId) {
    throw new ArtifactForbiddenError()
  }

  return artifact
}

/**
 * `kind` and `status` are text columns with CHECK constraints, so Prisma types
 * them as `string` while the database guarantees the union. This is the single
 * boundary where that gap is closed, and it is closed by checking rather than
 * asserting: a row that somehow violated its own constraint would throw here
 * instead of flowing into the UI mistyped.
 */
const narrowRow = <T extends { kind: string; status: string }>(row: T) => {
  if (!ARTIFACT_KINDS.includes(row.kind as ArtifactKind)) {
    throw new Error(`Unexpected artifact kind in database: ${row.kind}`)
  }
  if (!ARTIFACT_STATUSES.includes(row.status as ArtifactStatus)) {
    throw new Error(`Unexpected artifact status in database: ${row.status}`)
  }
  return row as T & { kind: ArtifactKind; status: ArtifactStatus }
}

export const listArtifacts = async (userId: string, kind: ArtifactKind) =>
  (await prisma.studio_artifacts.findMany({
    where: { user_id: userId, kind },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      kind: true,
      name: true,
      slug: true,
      preview_url: true,
      is_public: true,
      status: true,
      created_at: true,
      updated_at: true,
      // Selected so the list can render a per-row preview (P11-D8). Without it
      // the registered renderers have nothing to render and every row is an
      // empty frame, which is the defect. The payloads are small - bounded by
      // each kind's `.strict()` schema - so this is not the N+1 shape that
      // section 8.5 watches for.
      payload: true,
    },
  })).map(narrowRow)

/**
 * Reads one artifact for viewing. Unlike the mutations this allows a non-owner
 * through, but only on the same condition the RLS select policy encodes:
 * public *and* published. A public draft stays invisible.
 */
export const getArtifact = async (id: string, viewerId: string | null) => {
  const artifact = await prisma.studio_artifacts.findUnique({ where: { id } })

  if (!artifact) {
    throw new ArtifactNotFoundError()
  }

  const isOwner = viewerId !== null && artifact.user_id === viewerId
  const isPublished = artifact.is_public && artifact.status === "published"

  if (!isOwner && !isPublished) {
    throw new ArtifactForbiddenError()
  }

  return artifact
}

export const createArtifact = async (
  userId: string,
  input: {
    kind: ArtifactKind
    name: string
    slug: string
    payload: unknown
    preview_url?: string | null
  },
) =>
  prisma.studio_artifacts.create({
    data: {
      user_id: userId,
      kind: input.kind,
      name: input.name,
      slug: input.slug,
      payload: validatePayload(input.kind, input.payload),
      preview_url: input.preview_url ?? null,
    },
  })

export const updateArtifact = async (
  id: string,
  userId: string,
  input: {
    name?: string
    slug?: string
    payload?: unknown
    preview_url?: string | null
  },
) => {
  // The kind comes from the stored row, never from the caller. Letting a caller
  // supply it would let them pick which schema their payload is validated
  // against, which is the same as not validating it.
  const { kind } = await assertOwned(id, userId)

  return prisma.studio_artifacts.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.preview_url !== undefined && {
        preview_url: input.preview_url,
      }),
      ...(input.payload !== undefined && {
        payload: validatePayload(kind as ArtifactKind, input.payload),
      }),
    },
  })
}

export const setArtifactStatus = async (
  id: string,
  userId: string,
  status: ArtifactStatus,
) => {
  await assertOwned(id, userId)
  return prisma.studio_artifacts.update({ where: { id }, data: { status } })
}

export const setArtifactVisibility = async (
  id: string,
  userId: string,
  isPublic: boolean,
) => {
  await assertOwned(id, userId)
  return prisma.studio_artifacts.update({
    where: { id },
    data: { is_public: isPublic },
  })
}

/**
 * Deletes the row, then sweeps the artifact's R2 objects (P11-D1).
 *
 * **Row first, storage second, and the order is the whole design.** The row is
 * the source of truth. Deleting objects first and then failing to delete the
 * row leaves an artifact the user can still open with its asset gone - a
 * visibly broken record. Failing the other way leaves an orphaned object, which
 * costs storage and nothing else. So the sweep is best-effort and never blocks
 * or reverses the delete.
 *
 * The prefix covers every object the artifact ever wrote, not only the one its
 * payload currently points at: the upload route mints a fresh UUID key per
 * upload, so re-uploading a photo already supersedes the previous object.
 * Those superseded objects are collected here too.
 */
export const deleteArtifact = async (id: string, userId: string) => {
  const { kind } = await assertOwned(id, userId)
  await prisma.studio_artifacts.delete({ where: { id } })

  try {
    // Imported lazily on purpose: `lib/r2` asserts its credentials at module
    // load, and only this branch needs them. A static import would make every
    // server module that merely reads an artifact require R2 env vars.
    const { ARTIFACT_BUCKET } = await import("../../constants")
    const { deleteR2Prefix } = await import("../../r2")
    await deleteR2Prefix({
      prefix: `${kind}/${userId}/${id}/`,
      bucketName: ARTIFACT_BUCKET,
    })
  } catch (error) {
    // Loud, because the alternative is orphans accumulating silently - which is
    // exactly how P11-D1 went unnoticed for a whole phase.
    console.error(
      `[artifacts] deleted row ${id} but could not sweep R2 prefix ` +
        `${kind}/${userId}/${id}/ - objects orphaned:`,
      error,
    )
  }
}

/** True when the slug is free for this owner and kind. */
export const isArtifactSlugAvailable = async (
  userId: string,
  kind: ArtifactKind,
  slug: string,
  excludeId?: string,
) => {
  const existing = await prisma.studio_artifacts.findFirst({
    where: {
      user_id: userId,
      kind,
      slug,
      ...(excludeId && { id: { not: excludeId } }),
    },
    select: { id: true },
  })
  return existing === null
}
