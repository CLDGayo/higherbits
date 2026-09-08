"use server"

import { auth } from "@clerk/nextjs/server"
import { z } from "zod"

import { isValidSlug } from "@/lib/utils/library-identity"
import {
  DuplicateSlugError,
  addComponentToLibrary,
  createLibrary,
  deleteLibrary,
  listUserLibraries,
  moveComponentToLibrary,
  removeComponentFromLibrary,
  setLibraryPublished,
  updateLibrary,
} from "./server/collections"

/**
 * Library mutations.
 *
 * Modelled on the deleteComponentAction pair in ./components.ts: Clerk auth,
 * zod parse, delegate to a server-only module that re-checks ownership against
 * the loaded row. The ownership check lives there rather than here because
 * Prisma bypasses RLS entirely - there is no second line of defence.
 */

const requireUserId = async () => {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

const collectionIdSchema = z.string().uuid()

const createLibrarySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  slug: z
    .string()
    .trim()
    .refine(isValidSlug, "Slug must be lowercase letters, numbers and hyphens"),
  description: z.string().trim().max(500).optional().nullable(),
  isPublic: z.boolean(),
})

export type CreateLibraryResult =
  | { ok: true; library: Awaited<ReturnType<typeof createLibrary>> }
  | { ok: false; field: "slug"; message: string }

/**
 * Returns a typed failure for a taken slug rather than throwing, so the dialog
 * can put the message under the right field. Everything else still throws.
 */
export const createLibraryAction = async (
  input: z.infer<typeof createLibrarySchema>,
): Promise<CreateLibraryResult> => {
  const userId = await requireUserId()
  const parsed = createLibrarySchema.parse(input)

  try {
    const library = await createLibrary(userId, parsed)
    return { ok: true, library }
  } catch (error) {
    if (error instanceof DuplicateSlugError) {
      return {
        ok: false,
        field: "slug",
        // Slugs are globally unique, so this can be another account's. Say so
        // instead of implying the user already has a library by that name.
        message: "That slug is already taken. Try a different one.",
      }
    }
    throw error
  }
}

export const listLibrariesAction = async () => {
  const userId = await requireUserId()
  return listUserLibraries(userId)
}

const updateLibrarySchema = z.object({
  collectionId: collectionIdSchema,
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  cover_url: z.string().url().optional().nullable(),
})

export const updateLibraryAction = async (
  input: z.infer<typeof updateLibrarySchema>,
) => {
  const userId = await requireUserId()
  const { collectionId, ...rest } = updateLibrarySchema.parse(input)
  await updateLibrary(collectionId, userId, rest)
  return { success: true }
}

const setPublishedSchema = z.object({
  collectionId: collectionIdSchema,
  isPublic: z.boolean(),
})

export const setLibraryPublishedAction = async (
  input: z.infer<typeof setPublishedSchema>,
) => {
  const userId = await requireUserId()
  const { collectionId, isPublic } = setPublishedSchema.parse(input)
  await setLibraryPublished(collectionId, userId, isPublic)
  return { success: true }
}

const libraryComponentSchema = z.object({
  collectionId: collectionIdSchema,
  componentId: z.number().int().positive(),
})

export const addComponentToLibraryAction = async (
  input: z.infer<typeof libraryComponentSchema>,
) => {
  const userId = await requireUserId()
  const { collectionId, componentId } = libraryComponentSchema.parse(input)
  await addComponentToLibrary(collectionId, componentId, userId)
  return { success: true }
}

/** Exclusive membership: adds to `collectionId`, clears the caller's others. */
export const moveComponentToLibraryAction = async (
  input: z.infer<typeof libraryComponentSchema>,
) => {
  const userId = await requireUserId()
  const { collectionId, componentId } = libraryComponentSchema.parse(input)
  await moveComponentToLibrary(collectionId, componentId, userId)
  return { success: true }
}

export const removeComponentFromLibraryAction = async (
  input: z.infer<typeof libraryComponentSchema>,
) => {
  const userId = await requireUserId()
  const { collectionId, componentId } = libraryComponentSchema.parse(input)
  await removeComponentFromLibrary(collectionId, componentId, userId)
  return { success: true }
}

const deleteLibrarySchema = z.object({ collectionId: collectionIdSchema })

export const deleteLibraryAction = async (
  input: z.infer<typeof deleteLibrarySchema>,
) => {
  const userId = await requireUserId()
  const { collectionId } = deleteLibrarySchema.parse(input)
  await deleteLibrary(collectionId, userId)
  return { success: true }
}
