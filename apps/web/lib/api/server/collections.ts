import "server-only"
import prisma from "../../prisma"
import { isUniqueConstraintError } from "../../utils/prisma-errors"

/**
 * Library reads and writes, all server-side.
 *
 * `public.collections` has **no grants for the `authenticated` role**, and that
 * was deliberate - supabase/restore-authenticated-grants.sql:524-526 says "no
 * browser-client call site. Grant deferred until a consumer exists." Phase 05
 * is that consumer, and it cannot extend the grants without Dashboard access.
 *
 * So every path goes through Prisma, which holds a direct Postgres connection
 * and is not subject to RLS. A browser `.from("collections")` would return
 * 42501 - and this codebase's `?? 0` habit would render that as an empty state
 * rather than an error. Do not add a client-side query here.
 *
 * Because RLS is bypassed, **ownership is this module's job**. Every mutation
 * loads the row and throws unless the caller owns it.
 */

export interface LibrarySummary {
  id: string
  name: string
  slug: string
  description: string | null
  cover_url: string | null
  is_public: boolean
  created_at: Date
  updated_at: Date
  components_count: number
}

export class DuplicateSlugError extends Error {
  constructor(slug: string) {
    super(`The slug "${slug}" is already taken`)
    this.name = "DuplicateSlugError"
  }
}

/**
 * The owner's libraries.
 *
 * User-scoped on purpose: `get_collections_v1` returns all public collections
 * plus the caller's private ones, which is the public catalog's question, not
 * the studio's. Scoping here also keeps this list in agreement with the sidebar
 * badge, which counts `collections WHERE user_id = ?`
 * (components/features/studio/studio-counts.ts:84).
 */
export const listUserLibraries = async (
  userId: string,
): Promise<LibrarySummary[]> => {
  const rows = await prisma.collections.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    include: {
      _count: { select: { components_to_collections: true } },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    cover_url: row.cover_url,
    is_public: row.is_public,
    created_at: row.created_at,
    updated_at: row.updated_at,
    components_count: row._count.components_to_collections,
  }))
}

/** Throws unless the collection exists and belongs to `userId`. */
const assertOwned = async (collectionId: string, userId: string) => {
  const collection = await prisma.collections.findUnique({
    where: { id: collectionId },
    select: { id: true, user_id: true },
  })

  if (!collection) {
    throw new Error("Library not found")
  }

  if (collection.user_id !== userId) {
    throw new Error("Unauthorized to modify this library")
  }

  return collection
}

export const createLibrary = async (
  userId: string,
  input: {
    name: string
    slug: string
    description?: string | null
    isPublic: boolean
  },
): Promise<LibrarySummary> => {
  try {
    const row = await prisma.collections.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description || null,
        is_public: input.isPublic,
        user_id: userId,
      },
    })

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      cover_url: row.cover_url,
      is_public: row.is_public,
      created_at: row.created_at,
      updated_at: row.updated_at,
      components_count: 0,
    }
  } catch (error) {
    // `collections.slug` is unique GLOBALLY, not per user, so this fires when
    // any other account already holds the slug. Making it per-user would need a
    // migration, which D2-R rules out - so the message has to be honest rather
    // than implying the user already owns one by that name.
    if (isUniqueConstraintError(error)) {
      throw new DuplicateSlugError(input.slug)
    }
    throw error
  }
}

export const updateLibrary = async (
  collectionId: string,
  userId: string,
  input: {
    name?: string
    description?: string | null
    cover_url?: string | null
  },
) => {
  await assertOwned(collectionId, userId)

  return prisma.collections.update({
    where: { id: collectionId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.cover_url !== undefined ? { cover_url: input.cover_url } : {}),
      updated_at: new Date(),
    },
  })
}

/**
 * Publish state.
 *
 * `is_public` already means "in the public catalog": `get_collections_v1`
 * filters on it (supabase/rpc-functions.sql:554). Note that unpublishing does
 * NOT hide the library from anyone holding its URL - `/c/[collection_slug]`
 * deliberately does not check `is_public`. That split is the intended
 * behaviour, approved 2026-08-11.
 */
export const setLibraryPublished = async (
  collectionId: string,
  userId: string,
  isPublic: boolean,
) => {
  await assertOwned(collectionId, userId)

  return prisma.collections.update({
    where: { id: collectionId },
    data: { is_public: isPublic, updated_at: new Date() },
  })
}

export const addComponentToLibrary = async (
  collectionId: string,
  componentId: number,
  userId: string,
) => {
  await assertOwned(collectionId, userId)

  // The join table's PK is (collection_id, component_id), so adding twice would
  // raise P2002. Adding something already present is not an error worth
  // surfacing to the user.
  await prisma.components_to_collections.upsert({
    where: {
      collection_id_component_id: {
        collection_id: collectionId,
        component_id: componentId,
      },
    },
    create: { collection_id: collectionId, component_id: componentId },
    update: {},
  })
}

export const removeComponentFromLibrary = async (
  collectionId: string,
  componentId: number,
  userId: string,
) => {
  await assertOwned(collectionId, userId)

  await prisma.components_to_collections.deleteMany({
    where: { collection_id: collectionId, component_id: componentId },
  })
}

export const deleteLibrary = async (collectionId: string, userId: string) => {
  await assertOwned(collectionId, userId)

  // Join rows go first - the FK has no cascade declared in the schema.
  await prisma.components_to_collections.deleteMany({
    where: { collection_id: collectionId },
  })

  await prisma.collections.delete({ where: { id: collectionId } })
}
