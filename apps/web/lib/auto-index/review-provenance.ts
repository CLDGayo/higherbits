import { z } from "zod"

export const AUTO_INDEX_REVIEW_CHECKLIST_VERSION = "component-review-v2" as const

const checklistSchema = z.object({
  source_identity_verified: z.literal(true),
  source_bytes_verified: z.literal(true),
  license_and_notice_verified: z.literal(true),
  dependencies_verified: z.literal(true),
  demo_and_assets_verified: z.literal(true),
  saved_prompts_verified: z.literal(true),
  publication_metadata_verified: z.literal(true),
}).strict()

const reviewRequestSchema = z.object({
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  checklistVersion: z.literal(AUTO_INDEX_REVIEW_CHECKLIST_VERSION),
  checklist: checklistSchema,
  idempotencyKey: z.string().min(1).max(128).regex(/^[A-Za-z0-9:_-]+$/),
}).strict()
const finalizeRequestSchema = z.object({
  decisionId: z.string().regex(/^[1-9]\d{0,18}$/),
}).strict()

export type AutoIndexReviewRequest = z.infer<typeof reviewRequestSchema>
export type AutoIndexFinalizeRequest = z.infer<typeof finalizeRequestSchema>

/** Reject client-supplied identity, outcome, decision IDs, and all unreviewed payload fields. */
export function parseAutoIndexReviewRequest(value: unknown): AutoIndexReviewRequest | null {
  const parsed = reviewRequestSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function parseAutoIndexFinalizeRequest(value: unknown): AutoIndexFinalizeRequest | null {
  const parsed = finalizeRequestSchema.safeParse(value)
  if (!parsed.success) return null
  try {
    return BigInt(parsed.data.decisionId) <= 9_223_372_036_854_775_807n ? parsed.data : null
  } catch {
    return null
  }
}

/** Require an exact HTTPS Origin match; missing Origin and cross-site requests fail closed. */
export function isCanonicalSameOriginRequest(headers: Headers, canonicalOrigin: string | undefined): boolean {
  if (!canonicalOrigin) return false

  let expected: URL
  try {
    expected = new URL(canonicalOrigin)
  } catch {
    return false
  }

  if (expected.protocol !== "https:" || expected.origin !== canonicalOrigin) return false
  if (headers.get("origin") !== expected.origin) return false

  const fetchSite = headers.get("sec-fetch-site")
  return fetchSite === null || fetchSite === "same-origin"
}
