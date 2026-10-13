# Independent two-document and risk-record review — 12-10-26

TL;DR: The exact two-document qualification diff passes independent static review and assertions. All five canonical risk artifacts now exist and their validator passes; that is not readiness or approval. Current raw unit proof is 117 files / 928 PASS plus overlapping focused 30 PASS, with 794 matching source fingerprints. Keep the phase REJECT: explicit public-baseline acceptance is unanswered, and the separate compatibility audit identifies MCP FAQ and console contextual-copy gaps.

## Scope

Reviewed only the new changes to `apps/web/public/llms.txt` and `apps/web/public/llms-full.txt`, their writer's source/truth ledger in `session-doc-claims_REPORT_12-10-26.md`, and captured before/after bytes and `exact.diff` under `evidence/phase-01/session-doc-claims-12406607-ca23-45ef-8429-dc0b942db714/`. Both paths' user ownership and standing consent were explicit. This is a separate independent review after `session-phase01-compat-review_REPORT_12-10-26.md`; that earlier compatibility inventory excluded these docs.

Subsequent user steering added semantic review of all five current `harness/*.json` records, current final-unit proof and the console fallback context. Reused the selected Phase 01 plan, context/test routing, implementation standards and canonical risk-evidence skill already read. Graphify queries preceded each new scope update. Two-pass review covered blocking truth/contract issues, then informational limitations. No source/policy/plan/risk-record edit or phase transition; only this report and the compatibility report were written.

No browser, npm lookup, provider operation, API invocation, credential/state-content read, dependency installation, cost operation or unrelated RPC-security investigation. Cited code was read as text; modules were not imported or invoked. Legal language was compared to existing repository notices/policy, not externally interpreted or certified.

## Exact-diff integrity — PASS

Independent Node standard-library assertions established:

- Both `before/` byte snapshots match `baseline.json` SHA-256 values.
- Both current documents equal their `after/` snapshots and `after-sha256.json` values.
- Recomputing the two `git diff --no-index` outputs against captured pre-edit bytes reproduces saved `exact.diff` byte-for-byte: **35 added / 42 removed lines**. This excludes earlier user-owned work, unlike a HEAD-only diff.
- All six protected source fingerprints still match the writer's baseline: terms, privacy, refunds, our-story, MCP config and MCP console.
- All pre-existing document navigation URLs remain, as do HigherBits identity, Magic Patterns/vendor names, source/reference links, and full-document numbered sections 1–7.

| Document | Reviewed final SHA-256 |
|---|---|
| `apps/web/public/llms.txt` | `3592276260748a9f3270531d5be3284b526ef6179450457918ca59ee646f21bd` |
| `apps/web/public/llms-full.txt` | `0ba3d89014462d549a436c9e69da84a26c02563d7b2a38ded5628da4086c4297` |

The writer's `verify.cjs` was inspected, not rerun, because it overwrites its result artifact. Independent equivalent assertions ran read-only and passed; results are in this session's tool output. No writer evidence was overwritten.

## Changed-claim truth review — PASS within the two-doc diff

Paths in this table are repository-relative, with current source start lines.

| Claim family | Result and actual source corroboration |
|---|---|
| Uniform MIT / no notices / complete ownership | Removed. Both docs now defer to each item's published license, required copyright/permission notices, dependency licenses and possible premium commercial terms. `LICENSE:12` expressly retains notices; `apps/web/lib/licenses.ts:7` offers multiple licenses; `components/features/component-page/info-section.tsx:143` reads `component.license`. No replacement blanket rights grant. |
| Legal policy | Existing Terms are linked, not rewritten or presented as displaced by a summary. The exact current terms/privacy/refunds bytes match before fingerprints. The pre-existing relationship between item licensing and platform restrictions is not adjudicated. |
| Zero runtime dependencies | Removed. Copying source into a compatible project is distinguished from the component's actual React/Radix/motion/etc. requirements. `components/ui/button.tsx:1` and `accordion.tsx:3` import runtime packages; `lib/prompts.tsx:144` assembles install instructions; `app/api/r/[username]/[component_slug]/route.ts:368` returns files and npm dependencies. “No runtime dependency on the HigherBits service” describes source distribution, not zero dependencies or a catalog-wide guarantee about every asset/service. |
| Bare HigherBits CLI / automatic install | Unsupported `npx higherbits add` and universal auto-configuration promises removed. `packages/ai/package.json:2` names the different scoped MCP package and :6 its binary. No inference that the bare remote package is broken/nonexistent; no npm lookup. |
| Conditional registry command | Existing `npx shadcn@latest add` URL pattern retained only when the item's page supplies a command, with actual author/slug instructions. `apps/web/next.config.mjs:84` rewrites `/r/` to `/api/r/`; `component-preview.tsx:390` constructs the route and :429 the shadcn command. Source can append an access token; docs correctly direct users to actual item instructions rather than guaranteeing every anonymous sample URL works. No signed URL/token generated. |
| GHL actual compiler / automatic output | Unsupported uniform compilation promise removed. `lib/prompts.tsx:629` supplies conversion instructions, including Tailwind CDN/preflight/scoped-reset requests. `app/api/prompts/route.ts:162` separately branches to prepared bundle, cached HTML (:177), or generation (:217). `preview-dialog.tsx:276` calls that API; `components/ui/command-menu.tsx:332` instead requests EXTENDED. Docs distinguish template instructions from actual supported export paths rather than claiming every copy action returns the template. |
| GHL output dependencies / isolation | `lib/ghl-generator.ts:395` requests inline output/no CDN; it does not establish actual output quality. `lib/ghl-bundle-export.ts:9` and :80 handle constrained bundle forms, with Shadow DOM at :150. Docs explicitly say generation can fail, output/dependencies vary, and isolation does not guarantee no conflicts. No generated/deployed/host compatibility proof invented. |
| Universal editable sandbox | Removed. `preview-renderer.tsx:163` selects Sandpack, :183 a bundled iframe, :221 unavailable content; `preview-dialog.tsx:257` can return null. Final docs qualify editing/theme/control availability by item/path. |
| Payment / payout readiness | Changed to existence of code paths with configuration/account/offer eligibility limits. Stripe bundle route :10/:29 checks configuration/returns 503; Lemon Squeezy checkout :9/:18 restricts plan/config and :94 calls its provider; Stripe dashboard route :12 depends on an account. No configured checkout, creator payout, entitlement or delivery claim. No billing behavior was changed or tested by this docs slice. |
| Time-sensitive directory count | Removed 130+ headline. `lib/data/libraries-data.ts:2969` and `features/libraries/libraries-list.tsx:34/:106` substantiate a static directory/display, not live availability. Final text asks readers to consult current listings. |
| Competitor capabilities / lock-in | Unsupported matrix removed; shadcn/ui, 21st.dev and v0 references retained as third-party navigation with explicit unverified-capabilities qualification. No current competitor facts or externally sourced quotes are asserted. |

For source paths abbreviated inside table cells, component paths are under `apps/web/components/`, and `lib/`/`app/` under `apps/web/`. The source citations were checked directly. Neither spelling consistency nor matching assertion strings alone proves truth; the narrowed wording and cited branches together justify this bounded PASS.

No unsupported blanket licensing/no-notice/zero-dependency/bare-HigherBits-installer/actual-GHL-compiler assertion remains in these two revised documents. Existing broad marketing descriptions outside changed claims are not a catalog-wide certification. No runtime, live provider, registry installation or policy compliance result is inferred.

## Preservation / risk classification

Current `@higherbits-dev/cli@latest` generators, JSON command keys/arguments and literal `npx higherbits-ai` fallback remain untouched: the exact MCP config/console fingerprints match pre-edit bytes. The two-doc change adds no handler, method, payload, auth, payment state, schema, destructive write, startup/routing behavior or secret boundary. **This bounded prose qualification is low risk and does not independently require a new high-risk packet or human approval.** The broader selected program's existing external-contract/routing classification remains separately applicable.

The later console observation is a distinct existing source gap, not a defect introduced by these docs: `console/page.client.tsx:655/:660/:664` presents the unresolved fallback as a working AI MCP installation. The compatibility report now gives exact minimal copy-only guidance: MCP setup identity and an absent-generated-command label “Legacy fallback (unverified): package availability and startup behavior have not been verified.” Preserve the literal and existing generated commands; do not assert remote failure, silently substitute packages, or run npm. No edit was made.

## Semantic review of all five canonical risk records

Current packet was read in full. Canonical `validate-evidence-pack.mjs <task-folder>` independently returned `warnings: []`, `failures: []`. All five JSON objects parse; a bounded obvious-secret-pattern check also passed. Manual inspection found public source identifiers and relative evidence references, not actual secrets, user cookies, credentials, state-file contents or account PII. This is a bounded artifact review, not an OS/network/privacy audit.

| Record | Semantic verdict and needed owner follow-through |
|---|---|
| `risk-gate.json` | Correct external-contract class; distinguishes preserved route/API/request/access behavior from auth/billing implementation changes. `approver` accurately identifies the orchestrator's classification review and standing consent, not invented human approval. `mustStopBeforeFinalize: true` and pending public-baseline choice are appropriate. No new consent/production probe required. |
| `context-snippets.json` | All six excerpts match their declared current file/line spans after whitespace/punctuation normalization: middleware :16–28, aliases :1, MCP gate :16–26, AI gate :47–59, subscribe :41–56. No line-citation correction required. Actual excerpts contain no environment values. For complete classified-surface coverage, add or directly link cited evidence for the two canonical handler files and preserved rate buckets/client serializer; current entries establish aliases and guards but omit those direct underlying surfaces. The compatibility report already supplies the byte-preservation and static equivalence proof; no new behavior test is needed solely for this addition. |
| `verification.json` | Steps accurately separate positive local results, historical failures, pending original-baseline recovery and excluded probes. Its two-doc PASS is explicitly writer-level with independent review pending; this report now supplies that review. Update provenance/notes to reference it and the compatibility report's remaining FAQ/console findings before using the record for closure. Do not imply entire B1/B2/D4 truth acceptance from the docs PASS. |
| `review-decision.json` | Existing uppercase REJECT, reviewer and timestamp are valid. It is a historical decision: its rationale still describes packet/native/doc evidence as missing, although those facts have advanced. **Retain REJECT** while baseline/source acceptance is unresolved; preserve the old rationale as history and link a current disposition explaining resolved vs remaining gates. Do not erase the old decision, silently turn it into APPROVE, or treat validator success as approval. |
| `adversarial-validation.json` | Narrowly scoped true dispositions have real local evidence: alias function identity, query boundaries, signed-out redirects, synthetic subscribe tests and original-asset preservation reviews. Explicit false/deferred deployed-permission/non-admin/RPC scenario is honest and not a new required production probe; no auth-control change is part of this slice. Frame it as outside-scope evidence, not a new blocking security hypothesis. Seed-state/privacy behavior is documented separately in the footer report; source/content compatibility findings still need resolution independently. |

The context-snippet additions and current provenance/disposition notes are report-quality corrections to the existing canonical handoff, not a request to harmonize an unrelated validator schema or add source/provider tests. Do not append a fabricated human approval field because another helper has a different schema. Artifact presence is complete; approval/readiness is not.

### Current evidence cross-check

Read preserved final unit evidence directly under `evidence/phase-01/session-final-unit-d09b0a66-5731-4801-99e0-0f1f455ecf9f/post/package-unit/`:

- `stdout.log` records 117 files / 928 PASS; package and focused exit files are both 0.
- `focused-results.json` contains 30 passing assertions / 0 failed/pending across actual selected files: 6 client, 17 subscribe, 2 aliases, 5 canonical handlers. These overlap the package total.
- All three source manifests have equal per-file maps and aggregate `a42b763d35b7f023cd8e63165aab04a2efacb35db67279c96a357a209f9a4281`. Independently rehashed all 794 listed files: **zero current differences**. Public docs are excluded from that inventory and verified separately above. Endpoint hashes do not claim continuous filesystem monitoring.
- The preceding compatibility audit directly checked the ten public raw Axe attachments, four genuine protected baseline/post pairs and final affected MCP pairs. Public post-only remains distinct from original-baseline proof.
- Dark recovery raw exit 0 has six captures; footer raw exit 0 has eight. Their native reviewers report PASS. The footer report documents scoped Reject in eight disposable contexts, no normal-profile/state saveback, no terms/Accept click, prior failures retained, and no populated private form fields. This reviewer inspected reports/raw records, not native pixels or private seed-state contents. Do not claim packet-level analytics traffic auditing or wholly unobscured page proof.

Current full-suite proof supersedes the compatibility report's earlier older-full-suite snapshot. Current canonical artifact presence likewise supersedes its earlier four-missing-artifact state. Neither supersedes unresolved acceptance requirements.

## Findings and recommended next state

**Blocking/high findings within the exact two-doc diff: none.** No concurrency, exception boundary, API compatibility, validation/auth, query-efficiency or data-leak behavior is introduced by static prose. Required notices/source/vendor identities and caller command strings are preserved.

**Informational:** narrow source evidence does not certify catalog-wide licensing, remote commands, configured providers, rendered GHL output, legal policy or third-party capabilities. These are explicitly qualified/deferred and do not justify new provider/npm/security work.

**Phase closure remains REJECT/BLOCKED:** the explicit historical-public-baseline acceptance choice is unanswered; the existing MCP FAQ and console instructional-copy gaps in the compatibility report remain. Finish only already-authorized owner reconciliation and bounded source corrections/review; no phase transition or waiver is implied. Dark/footer completion and current unit success should be recorded as completed, not retained as stale blockers.

```text
PLAN UPDATE REQUEST:
- Section: B2 / D4 / EVL Handoff | Issue: Two-doc independent review was pending | Recommended addition: Record exact two-doc 35-add/42-delete review PASS with preserved hashes, source ledger and explicit external/legal/runtime limits.
- Section: D5 / Risk Evidence | Issue: Packet exists but direct canonical-surface snippets/current review provenance and historical rejection disposition need reconciliation | Recommended addition: Link preserved canonical/body/bucket/client proof and this semantic review, retain REJECT with the current unresolved baseline and source-copy findings, and preserve the historical decision rationale.
```

**Status:** DONE_WITH_CONCERNS
**Summary:** Independent exact two-doc/static-truth review PASS; current unit and five-record packet facts independently corroborated. No source or policy edits required for the reviewed doc diff.
**Concerns/Blockers:** Phase remains REJECT/BLOCKED for unanswered baseline acceptance and separate FAQ/console copy; packet provenance/coverage notes need owner reconciliation. Skipped browser/provider/npm/native/legal-compliance proof; no approval or baseline waiver invented.
