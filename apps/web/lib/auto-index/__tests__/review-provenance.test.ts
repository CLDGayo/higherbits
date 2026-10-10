import { expect, it } from "vitest"
import { parseAutoIndexFinalizeRequest, parseAutoIndexReviewRequest, isCanonicalSameOriginRequest } from "@/lib/auto-index/review-provenance"

const checklist = {
  source_identity_verified: true,
  source_bytes_verified: true,
  license_and_notice_verified: true,
  dependencies_verified: true,
  demo_and_assets_verified: true,
  saved_prompts_verified: true,
  publication_metadata_verified: true,
}

const validBody = {
  fingerprint: "a".repeat(64),
  checklistVersion: "component-review-v2",
  checklist,
  idempotencyKey: "review-12-once",
}

it("accepts only the exact seven affirmative review attestations and preserves the fingerprint", () => {
  expect(parseAutoIndexReviewRequest(validBody)).toEqual(validBody)
})

it.each([
  { ...validBody, reviewerUserId: "user_forged" },
  { ...validBody, candidateId: 12 },
  { ...validBody, decisionId: 34 },
  { ...validBody, outcome: "approved" },
  { ...validBody, checklist: { ...checklist, source_bytes_verified: false } },
  { ...validBody, checklist: { ...checklist, unexpected: true } },
  { ...validBody, checklistVersion: "component-review-v1" },
  { ...validBody, fingerprint: "A".repeat(64) },
  { ...validBody, idempotencyKey: "x".repeat(129) },
])("rejects forged, incomplete, or extra review fields", (body) => {
  expect(parseAutoIndexReviewRequest(body)).toBeNull()
})

it("accepts only one positive PostgreSQL bigint decision ID for finalization", () => {
  expect(parseAutoIndexFinalizeRequest({ decisionId: "42" })).toEqual({ decisionId: "42" })
  expect(parseAutoIndexFinalizeRequest({ decisionId: "42", slug: "caller-controlled" })).toBeNull()
  expect(parseAutoIndexFinalizeRequest({ decisionId: "0" })).toBeNull()
  expect(parseAutoIndexFinalizeRequest({ decisionId: "9223372036854775808" })).toBeNull()
})

it("requires an exact canonical Origin and rejects missing or cross-site origins", () => {
  const headers = (origin?: string, site?: string) => new Headers({
    ...(origin ? { origin } : {}),
    ...(site ? { "sec-fetch-site": site } : {}),
  })

  expect(isCanonicalSameOriginRequest(headers("https://higherbits.dev", "same-origin"), "https://higherbits.dev")).toBe(true)
  expect(isCanonicalSameOriginRequest(headers(), "https://higherbits.dev")).toBe(false)
  expect(isCanonicalSameOriginRequest(headers("https://evil.example", "cross-site"), "https://higherbits.dev")).toBe(false)
  expect(isCanonicalSameOriginRequest(headers("https://higherbits.dev/other"), "https://higherbits.dev")).toBe(false)
})
