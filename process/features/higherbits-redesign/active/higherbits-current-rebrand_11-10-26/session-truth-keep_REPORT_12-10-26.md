# Truth / KEEP reconciliation — 12-10-26

TL;DR: No current first-party Magic/21st branding replacement is needed in the six requested documents. Vendor/history/compatibility references should remain. B2/D4 truth acceptance is not fully proven: licensing copy contradicts local notices/terms, and several capability/command/comparison claims lack bounded evidence. Phase 01 remains BLOCKED from VERIFIED.

## Scope and proof level

Graphify queried first. Reviewed the selected Phase 01 Public Contracts, B2/D4 and pinned KEEP references; current llms.txt, llms-full.txt, our-story, terms, privacy and refunds; and the named image consumers. Applied vc-risk-evidence-pack to the decision record. Local source reads, scoped git diffs and assert-based checks only: no product edits, browser/provider calls, credential reads, runtime reruns, commits or deployments. Main owns plan reconciliation.

Paths below are repository-relative. This review did not change any claim. At inspection, llms.txt and our-story were already modified, llms-full.txt was untracked, and the three legal pages had no tracked diff. That establishes ownership boundaries, not authorship or truth. Our-story's current tracked diff changes metadata/structured data, while retaining the narrative.

## Current occurrence / claim ledger

| Source proof | Classification and disposition |
|---|---|
| apps/web/public/llms.txt:1, :18 | HigherBits.dev is current first-party identity. Magic Patterns is a named external visual builder: KEEP, not former Magic product branding. |
| apps/web/public/llms-full.txt:1, :16, :80 | HigherBits.dev is current identity; Magic Patterns is vendor copy. 21st.dev labels the comparison column: KEEP the identity. The particular competitor capability claims at :83–88 are not independently verified here. |
| apps/web/app/our-story/page.tsx:102, :111, :153, :225 | HigherBits founding narrative distinguishes inspiration/discovery and the forked 21st.dev repository. External links at :113, :157, :228 and static story images at :115, :159, :230 are history/attribution: KEEP. Founder metadata at :13 and :43–48 is consistent with the narrative, not independent proof of biography or repository license provenance. |
| apps/web/app/(utility)/terms/page.tsx:4, :28, :108, :146, :200 | Current site/operator names are HigherBits.dev / Higher Bits Labs Inc. Preserve existing ownership, DMCA and contact disclosures. No Magic/21st residue; statutory/company/contact accuracy was not externally checked. |
| apps/web/app/(utility)/privacy/page.tsx:20, :61, :73, :77, :88–90 | Current operator name is correct. 21st_anon_id is an actual compatibility key, confirmed at apps/web/hooks/use-analytics.ts:6; consent initialization/revocation at :54–79 supports that narrow disclosure statically. KEEP the key. Clerk/Stripe/Supabase are vendor names, not rename targets. Whole-policy compliance/provider completeness is unproven. |
| apps/web/app/(utility)/refunds/page.tsx:4, :27, :47, :91, :113, :123 | Current identity/operator and existing refund/contact policy remain untouched. Timing, fulfillment and legal claims are preserved, not independently certified. No Magic/21st residue. |

Static assertions classified every Magic/21st occurrence in all six files and passed. This proves the bounded textual classification, not factual accuracy, rendered accessibility or exhaustive legal review. No zero-match rule was used.

## Pinned KEEP reconciliation

- process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-02-brand-sweep_REPORT_11-07-26.md:11 and phase-05-long-tail-qa_REPORT_11-07-26.md:27–28 contain historical zero-brand-match/runtime claims. They do not override today's intentional vendor/history/key matches, prove today's pixels, or supply the missing fresh public baseline.
- process/features/higherbits-cozy-rebrand/completed/higherbits-cozy-rebrand_12-07-26/phase-02-brand-sweep_PLAN_12-07-26.md:60–79 and :414–424 preserve functional package/repository/template/file identifiers, rather than authorizing global replacement. Current sandbox still reads 21st-registry.json at apps/web/components/features/studio/sandbox/hooks/use-file-system.ts:214 and :223. Keep it.
- Historical @21st-dev package names and 21st-dev/magic-mcp links are not current-value requirements. Phase 01 C07 explicitly preserves current @higherbits-dev/cli@latest; apps/web/lib/config/higherbits-mcp.ts:10–11 and packages/ai/package.json:2 corroborate the local package identity. Current header GitHub link/star target is CLDGayo/higherbits-mcp at apps/web/components/features/higherbits-mcp/higherbits-mcp-header.tsx:60 and :67; hero matches at hero.tsx:375 and :382. Do not restore historical strings. Remote availability is unproven.
- The historical codesandbox-sdk.ts survivor location has drifted: apps/web/lib/codesandbox-sdk.ts:2 now re-exports sandbox-templates. No template identifier was renamed or verified by inference from July's line references.
- Preserve unresolved console fallback npx higherbits-ai at apps/web/app/higherbits-mcp/console/page.client.tsx:664. No npm resolution or functionality claim is made.

## Minimum actionable source gap

**Reconcile licensing wording before accepting TRUTH-KEEP-09.** apps/web/public/llms-full.txt:94 promises MIT use/distribution without attribution requirements, while LICENSE:12 requires retaining copyright and permission notices. The same public promise conflicts with the blanket link-back requirement at apps/web/app/(utility)/terms/page.tsx:87–90 and redistribution restriction at :75. These are observed local textual inconsistencies, not a new legal ruling. The smallest correction is owner-reviewed documentation that points to each item's actual license, preserves required notices, and states the intended scope of platform/media restrictions. Do not silently rewrite legal terms or strip notices. Existing HEAD llms.txt already qualified licensing by each component's detail page; its current rewrite removed that qualification.

Two further claims need bounded evidence or qualification, without provider probes:

- llms.txt:5 and llms-full.txt:9–12 promise zero runtime dependencies; llms-full.txt:40 itself lists runtime packages to install. Qualify this as no runtime dependency on HigherBits where accurate; retain actual component dependency instructions. llms.txt:19 already uses the narrower phrasing.
- llms.txt:8 and llms-full.txt:28 advertise npx higherbits add; the inspected local package is @higherbits-dev/cli with binary higherbits-dev-cli (packages/ai/package.json:2, :7). Local source does not establish the advertised bare npm command. Do not assume it is broken remotely or replace it with the MCP package, whose purpose differs. Main should supply existing command evidence or qualify/remove the unsupported installation promise.

Other untouched claims remain evidence-limited: llms.txt:11 (130+ libraries), :22 / llms-full.txt:86 (payment capabilities), llms-full.txt:17 (every component editable), :50–52 (compiled GHL widgets/isolation) and :83–88 (competitor comparisons). Preserve vendor identities, but do not label these claims validated merely because the spelling is correct. No broad feature/policy audit or new implementation is requested by this report.

## Current asset-to-consumer map — static PASS

| Asset | Current consumer proof |
|---|---|
| apps/web/public/higherbits-mcp-social-card.png | MCP OpenGraph and Twitter at apps/web/app/higherbits-mcp/page.tsx:26 and :37; invite email absolute HTTPS URL at apps/web/lib/emails/invite-template.tsx:29, alt at :32. Exactly three references across these consumers. |
| apps/web/public/higherbits-component-preview.svg | AI preview at apps/web/app/magic-chat/page.client.tsx:413, route-specific illustrative alt at :414; MCP preview at apps/web/components/features/higherbits-mcp/hero.tsx:473, alt at :474. Exactly two references. SVG :1–3 declares 1440×900 and explicitly says illustration, not working-product screenshot. |
| apps/web/public/og-image.png | AI OpenGraph/Twitter at apps/web/app/magic-chat/page.tsx:29 and :39. Shared generic art also used by app/layout.tsx:39 and :52 and app/page.tsx:122 and :134. next.config.mjs:101 adds its content-type header, not a replacement/redirect. |

Assertions passed for all seven named product/email reference occurrences and absence of old magic-preview, magic-chat-og and higherbits-mcp-og-image references in those five consumer files. Original raster existence does not imply active consumption. Story art is a separate retained historical consumer, not approved current product art.

Current asset fingerprints (observation only, no earlier hash equality inferred):

- Social card: 1200×630 PNG; SHA-256 225b100eb361aeec32634c495615abb1e956491b92b3dae5c3d893b23fc35294.
- Generic AI OG: 2400×1260 PNG; SHA-256 b4ad8ecfe18ce0a522da5ead8b09c2ed3f7aa2804bf41967024eb51025f0f509.
- Shared preview SVG: SHA-256 fb6084731420057c9b891a641ccb2b1f4685a5c07d1f0a6d419d84782de3e019.

The historical final-runtime report records 20 PASS, four empty admin baseline/post Axe comparisons and eight correct-header viewport screenshots. Those results were checked in the preceding exit review, not rerun here. Neither source mapping nor historical screenshots establish current below-fold pixel review, deployed email-image delivery or complete public pre/post accessibility.

## Review decision and remaining evidence

Created harness/review-decision.json with **decision: REJECT** and an explicit **BLOCKED** rationale using .claude/skills/vc-risk-evidence-pack/SKILL.md:83–91. implementation-standards.md:55–57 delegates the contract to that skill; validate-evidence-pack.mjs:39–50 agrees on APPROVE/REJECT. Standalone assertions passed for its four fields, REJECT/BLOCKED and timestamp, and SHA-256 checks confirmed all six inspected documents stayed unchanged. The full validate-evidence-pack.mjs run failed on exactly the four missing artifacts listed below, with no decision-enum failure; the packet is not complete. No approver identity, risk approval, provider result or passing adversarial outcome was invented.

Schema drift remains: README.md and validate-risk-artifacts.mjs:51, :69 instead expect task/decision/blockingFindings/nonBlockingFindings/notes and lowercase rejected. One decision cannot satisfy both enum sets. The canonical skill-backed record is explicit; no claim that both helpers or the complete packet pass. Missing inputs/artifacts remain harness/risk-gate.json (actual classification/approver), context-snippets.json (affected-risk-surface evidence), verification.json (complete step results), and adversarial-validation.json (real scenario dispositions or explicit allowed deferral). Main owns those artifacts and schema reconciliation; this review writes no invented replacements.

No baseline or phase-exit requirement is waived. Main may use this ledger for B2/D4 reconciliation, but cannot mark full truth acceptance or Phase 01 VERIFIED from it. No Graphify rebuild needed: only review artifacts were added and no code/context architecture changed.

**Status:** BLOCKED
**Summary:** Requested source/KEEP and consumer reconciliation is complete; no branding rename is needed. Licensing contradiction is the smallest concrete source gap, with capability/command claims still unproven.
**Concerns/Blockers:** Historical public baseline, full-content pixel proof, truth evidence and remaining risk packet are incomplete. Browser/provider/runtime checks and source edits were skipped; this is not phase-exit approval.
