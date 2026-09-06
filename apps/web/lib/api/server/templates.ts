import "server-only"
import prisma from "../../prisma"

/**
 * Template reads and writes for the studio, all server-side.
 *
 * Two reasons this never touches the browser client or the public RPC:
 *
 * 1. `templates`' live grant state is NOT version-controlled. The grants script
 *    says so explicitly, naming this phase - supabase/restore-authenticated-
 *    grants.sql:470-473: "NOTE for Phase 6: this REVOKE is the FIRST time any
 *    part of `templates`'s live grant state becomes version-controlled." So
 *    whether a browser write succeeds is genuinely unknown. Prisma holds a
 *    direct Postgres connection and sidesteps the question.
 *
 * 2. `get_templates_v3` must not be used to list a user's own templates. It is
 *    SECURITY DEFINER and gates private rows on nothing but a caller-supplied
 *    boolean - see the NOT-APPLIED fix in supabase/rpc-functions.sql. It also
 *    would not scope results to one user even if it were safe.
 *
 * Prisma bypasses RLS, so **ownership is this module's job**. Every mutation
 * loads the row and throws unless the caller owns it.
 */

export interface TemplateSummary {
  id: number
  name: string
  description: string | null
  preview_url: string
  video_url: string | null
  website_preview_url: string
  /**
   * Converted from Prisma's `Decimal`. A Decimal instance cannot cross the
   * server-to-client boundary - React rejects it as a non-plain object at
   * RUNTIME, which no typecheck or build would have caught.
   */
  price: number
  payment_url: string | null
  is_public: boolean
  downloads_count: number
  likes_count: number
  template_slug: string
  created_at: Date
  updated_at: Date
}

const toSummary = (row: {
  id: number
  name: string
  description: string | null
  preview_url: string
  video_url: string | null
  website_preview_url: string
  price: { toNumber: () => number }
  payment_url: string | null
  is_public: boolean | null
  downloads_count: number | null
  likes_count: number | null
  template_slug: string
  created_at: Date
  updated_at: Date
}): TemplateSummary => ({
  id: row.id,
  name: row.name,
  description: row.description,
  preview_url: row.preview_url,
  video_url: row.video_url,
  website_preview_url: row.website_preview_url,
  price: row.price.toNumber(),
  payment_url: row.payment_url,
  // Nullable in the schema with a `false` default; the studio treats absent as
  // not-public rather than showing an indeterminate state.
  is_public: row.is_public ?? false,
  downloads_count: row.downloads_count ?? 0,
  likes_count: row.likes_count ?? 0,
  template_slug: row.template_slug,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

/**
 * The owner's templates.
 *
 * User-scoped, which is also what keeps this in agreement with the sidebar
 * badge (`countRows("templates", userId)`, studio-counts.ts:84).
 */
export const listUserTemplates = async (
  userId: string,
): Promise<TemplateSummary[]> => {
  const rows = await prisma.templates.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
  })

  return rows.map(toSummary)
}

/** Throws unless the template exists and belongs to `userId`. */
const assertOwned = async (templateId: number, userId: string) => {
  const template = await prisma.templates.findUnique({
    where: { id: templateId },
    select: { id: true, user_id: true },
  })

  if (!template) {
    throw new Error("Template not found")
  }

  if (template.user_id !== userId) {
    throw new Error("Unauthorized to modify this template")
  }

  return template
}

export const updateTemplate = async (
  templateId: number,
  userId: string,
  input: {
    name?: string
    description?: string | null
    price?: number
    payment_url?: string | null
    website_preview_url?: string
  },
): Promise<TemplateSummary> => {
  await assertOwned(templateId, userId)

  // `template_slug` is deliberately absent: it is globally unique and already
  // published in links, so editing it would break them.
  const row = await prisma.templates.update({
    where: { id: templateId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.payment_url !== undefined
        ? { payment_url: input.payment_url }
        : {}),
      ...(input.website_preview_url !== undefined
        ? { website_preview_url: input.website_preview_url }
        : {}),
      updated_at: new Date(),
    },
  })

  return toSummary(row)
}

/**
 * Visibility.
 *
 * `get_templates_v3` filters its public branch on `is_public`
 * (rpc-functions.sql:604), so this does propagate to `/?tab=templates`.
 */
export const setTemplateVisibility = async (
  templateId: number,
  userId: string,
  isPublic: boolean,
): Promise<TemplateSummary> => {
  await assertOwned(templateId, userId)

  const row = await prisma.templates.update({
    where: { id: templateId },
    data: { is_public: isPublic, updated_at: new Date() },
  })

  return toSummary(row)
}

export const deleteTemplate = async (templateId: number, userId: string) => {
  await assertOwned(templateId, userId)

  // templates_tags declares onDelete: Cascade on its template relation, so the
  // tag joins go with it. Unlike components_to_collections, which does not.
  await prisma.templates.delete({ where: { id: templateId } })
}
