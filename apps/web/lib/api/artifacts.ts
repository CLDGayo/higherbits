"use server"

import { auth } from "@clerk/nextjs/server"
import { z } from "zod"

import {
  ARTIFACT_KINDS,
  ARTIFACT_STATUSES,
} from "@/components/features/studio/artifacts/registry"
import { isValidSlug } from "@/lib/utils/library-identity"
import {
  ArtifactPayloadError,
  createArtifact,
  deleteArtifact,
  getArtifact,
  isArtifactSlugAvailable,
  listArtifacts,
  setArtifactStatus,
  setArtifactVisibility,
  updateArtifact,
} from "./server/artifacts"

/**
 * Artifact mutations (Phase 09, §6.4).
 *
 * Same shape as ./collections.ts: Clerk auth, zod parse of the envelope, then
 * delegate to a server-only module that re-checks ownership against the loaded
 * row and validates the payload against the registry schema for that row's
 * kind. Neither of those checks belongs here - see the note in
 * ./server/artifacts.ts about why this path has no RLS behind it.
 */

const requireUserId = async () => {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

const kindSchema = z.enum(ARTIFACT_KINDS)
const idSchema = z.string().uuid()

const createSchema = z.object({
  kind: kindSchema,
  name: z.string().trim().min(1, "Name is required").max(100),
  slug: z
    .string()
    .trim()
    .refine(isValidSlug, "Slug must be lowercase letters, numbers and hyphens"),
  // Intentionally unknown: the real shape is decided by the registry schema for
  // `kind`, inside the server module. Restating it here would be a second
  // source of truth that could drift.
  payload: z.unknown(),
  preview_url: z.string().url().nullable().optional(),
})

const updateSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().refine(isValidSlug).optional(),
  payload: z.unknown().optional(),
  preview_url: z.string().url().nullable().optional(),
})

export type ArtifactMutationResult<T> =
  | { ok: true; artifact: T }
  | { ok: false; reason: "payload"; issues: string[] }

/**
 * Payload failures come back typed so a form can put each message on its field.
 * Everything else - unauthorized, not found, not yours - throws, because none
 * of those are things the current user can fix by editing the form.
 */
const withPayloadErrors = async <T>(
  run: () => Promise<T>,
): Promise<ArtifactMutationResult<T>> => {
  try {
    return { ok: true, artifact: await run() }
  } catch (error) {
    if (error instanceof ArtifactPayloadError) {
      return { ok: false, reason: "payload", issues: error.issues }
    }
    throw error
  }
}

export const listArtifactsAction = async (input: { kind: string }) => {
  const userId = await requireUserId()
  return listArtifacts(userId, kindSchema.parse(input.kind))
}

export const getArtifactAction = async (input: { id: string }) => {
  const { userId } = await auth()
  // Signed-out callers are allowed through: getArtifact still refuses anything
  // that is not both public and published.
  return getArtifact(idSchema.parse(input.id), userId ?? null)
}

export const createArtifactAction = async (
  input: z.input<typeof createSchema>,
) => {
  const userId = await requireUserId()
  const parsed = createSchema.parse(input)
  return withPayloadErrors(() =>
    createArtifact(userId, {
      kind: parsed.kind,
      name: parsed.name,
      slug: parsed.slug,
      payload: parsed.payload,
      preview_url: parsed.preview_url,
    }),
  )
}

export const updateArtifactAction = async (
  input: z.input<typeof updateSchema>,
) => {
  const userId = await requireUserId()
  const { id, ...rest } = updateSchema.parse(input)
  return withPayloadErrors(() => updateArtifact(id, userId, rest))
}

export const setArtifactStatusAction = async (input: {
  id: string
  status: string
}) => {
  const userId = await requireUserId()
  return setArtifactStatus(
    idSchema.parse(input.id),
    userId,
    z.enum(ARTIFACT_STATUSES).parse(input.status),
  )
}

export const setArtifactVisibilityAction = async (input: {
  id: string
  isPublic: boolean
}) => {
  const userId = await requireUserId()
  return setArtifactVisibility(
    idSchema.parse(input.id),
    userId,
    z.boolean().parse(input.isPublic),
  )
}

export const deleteArtifactAction = async (input: { id: string }) => {
  const userId = await requireUserId()
  await deleteArtifact(idSchema.parse(input.id), userId)
  return { success: true }
}

export const isArtifactSlugAvailableAction = async (input: {
  kind: string
  slug: string
  excludeId?: string
}) => {
  const userId = await requireUserId()
  return isArtifactSlugAvailable(
    userId,
    kindSchema.parse(input.kind),
    input.slug,
    input.excludeId ? idSchema.parse(input.excludeId) : undefined,
  )
}
