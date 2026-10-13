[MODE: VALIDATE]

Section: Layer 2 — Implementation Checklist Step B
Status: **CONCERN**

Mechanical feasibility: **PASS.** The migration fits the existing hook without changing its exported API or callers. The legacy key, initialization, duplicate lookup and insertion are present in [use-analytics.ts](/Users/clarencelloydgayo/Gayo%20Sphere/HigherBits.dev/apps/web/hooks/use-analytics.ts:6). The existing browser client recorder seam is at line 21. The planned independent alias operations, anonymous failure handling and signed-in preservation can remain inside that hook.

All four caller files use the same `capture(component_id, activity_type, user_id?)` contract: component page at lines 117/612, preview dialog at 204/380, copy button at 38, intercepted modal at 249. No caller edit is needed for the key migration.

The test infrastructure supports the proposed proof. [use-analytics.test.ts:27](/Users/clarencelloydgayo/Gayo%20Sphere/HigherBits.dev/apps/web/hooks/__tests__/use-analytics.test.ts:27) already supplies a query-builder stub; extend its immediate resolution with a controlled pending lookup. The scoped config correctly addresses the existing dotenv load in `apps/web/vitest.setup.ts:1–2`, while retaining the safe setup and discovery in `apps/web/vitest.config.ts:19–21`. Explicitly new fixture/config files are implementation work, not missing-file blockers.

Gaps found: **One high-risk lifecycle proof gap.** The plan’s ANON-INFLIGHT row requires revoke/reaccept cancellation, but does not explicitly test unmounting during the pending lookup: `phase-02-first-party-identifiers_PLAN_12-10-26.md:259`.

The current effect returns only the consent unsubscribe function ([use-analytics.ts:76](/Users/clarencelloydgayo/Gayo%20Sphere/HigherBits.dev/apps/web/hooks/use-analytics.ts:76)). Unsubscribe removes that listener ([consent.ts:64](/Users/clarencelloydgayo/Gayo%20Sphere/HigherBits.dev/apps/web/lib/consent.ts:64)). Consequently, a hook-local generation token updated only by subscription callbacks could miss revoke/reaccept after unmount. A pending signed-in capture could then see accepted consent again and insert; anonymous alias verification does not protect that path.

Add explicit cleanup invalidation and red-first assertions for pending capture → unmount → revoke/reaccept → resolve, for both anonymous and signed-in callers. Prove zero insertion from the discarded instance and successful capture from a newly mounted, authorized instance. This fits the existing hook/test allowlist.

Conflicts found: **None requiring scope expansion.** Persisted Research/Innovate/supplement agree with Step B’s legacy-first selection and combined proof. Phase01’s final EVL PASS and subsequent UPDATE PROCESS checkpoint establish local entry readiness; they do not certify Phase02 behavior.

Privacy B3 correctly targets the existing single-key and unconditional removal wording in [privacy/page.tsx:73](/Users/clarencelloydgayo/Gayo%20Sphere/HigherBits.dev/apps/web/app/(utility)/privacy/page.tsx:73). Disclose both aliases and best-effort deletion, retaining the consent-key wording at line 77. The planned browser fixture exercises real consent, compensating for the unit suite’s mocked consent module (`use-analytics.test.ts:22–25`).

Highest-risk edit + mitigation: **Consent cancellation across asynchronous lookup and component teardown.** Implement mutable cancellation state before wiring alias reconciliation; invalidate it during cleanup, and check it immediately before insertion. Preserve accepted signed-in capture when anonymous storage fails.

Applied `vc-scenario` to three lifecycle cases: unmount while pending; unmount followed by revoke/reaccept; replacement mount while the old lookup remains pending. All require the old capture to remain canceled. `vc-predict` verdict: **CAUTION**—architecture favors local cleanup, security requires cancellation, performance needs no retained listener, UX permits fresh authorized capture, and devil’s advocate rejects current-consent checks alone.

Skipped execution, browser/product tests, secrets and auth-state contents; no files changed or nested agents used. Risk: planned proof remains incomplete until teardown cancellation is explicitly covered.
