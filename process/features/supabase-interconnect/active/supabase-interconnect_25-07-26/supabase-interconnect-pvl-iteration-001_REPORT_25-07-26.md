# PVL Iteration 001 — supabase-interconnect

Date: 2026-07-25
Domain: plan
Driver: orchestrator
Cycle: 1 of 10 (cap)

## Baseline (cycle 0)

Outer PVL ran one `vc-validate-agent` per phase plan, concurrently. Six gates returned.

| Phase | Gate | FAILs | CONCERNs |
|---|---|---|---|
| 01 grant-repair | **BLOCKED** | 1 | 4 |
| 02 embedding-functions | CONDITIONAL | 0 | 3 |
| 03 scheduler | CONDITIONAL | 0 | 5 |
| 04 navigation | CONDITIONAL | 0 | 3 |
| 05 billing | **PASS** | 0 | 0 (3 fixed in-pass) |
| 06 schema-truth | CONDITIONAL | 0 | 2 (both fixed in-pass) |

Total gaps at baseline: 17 (1 FAIL + 16 CONCERN).

## Orchestrator-discovered gap (post-validate, added to cycle 1)

Severity FAIL. Phase 6's validator found `apps/web/package.json:7`'s `types` script and recommended
EXECUTE reuse it as a shortcut. Verification showed the script targets Supabase project
`vucvdpamtrjkzmubwlts`, while the live application database is `ewktoowpuemgbaaxxbdq` (confirmed by
this session's read-only live audit returning 33 functions / 4 views / 41 tables).
`supabase/config.toml:3` carries a third value, `project_id = "21st"`.

`process/features/21st-promotion/active/21st-promotion_08-07-26/harness/review-decision.json:9`
records that on 2026-07-09, connectivity was verified against `vucvdpamtrjkzmubwlts` and
`prisma db pull --print` returned `P4001 — introspected database empty`. The project subsequently
moved to `ewktoowpuemgbaaxxbdq`, where all `supabase/*.sql` was applied. The types-generation script
was never repointed.

This is the probable mechanical root cause of the program's headline finding — `types/supabase.ts`
describing a schema roughly twice the real size. Following the validator's recommendation unchanged
would have regenerated types from the wrong project and re-introduced the exact defect Phase 6
exists to eliminate.

Total gaps entering cycle 1: 18.

## Cycle 1 actions

Five `vc-plan-agent` supplements ran in parallel, one per plan needing changes, with disjoint file
scopes. Phase 05 required no supplement (PASS).

| Phase | Gaps addressed | Result |
|---|---|---|
| 01 | 5 | 0 new text required — the validator had already applied all five inline during its own pass; independently re-verified against `supabase/views.sql:81-122` and `restore-authenticated-grants.sql`; audit checkpoint added |
| 02 | 3 | A2 rewritten to UNION `components`+`demos` on `(item_id, item_type)`; new B7 privilege lockdown; new C0 runtime pre-check with fallback |
| 03 | 5 | New A0 reuse-discovery of the existing cron route; A1 corrected to edge-function invoke (no new secret); new A4 batch cap + `--dry-run`; new B3 log redirection; new B4 `flock` lock |
| 04 | 3 | New B1a SEO-preservation gate; new C1a orphan-route assertion; new D1a `home-layout.tsx` migrate-or-retain decision, added to Blast Radius |
| 06 | 1 (FAIL) | New A-0b (derive live ref from env, privacy-gated, never print), A-0c (repoint the script), B5 (assert regenerated types against live counts); B2 corrected and old guidance struck through for audit trail; root cause recorded in Purpose; `## Inner Loop Refresh Note` added to trigger re-validation |

## Notable correction to a subagent conclusion

Phase 01's supplement agent closed by asserting the BLOCKED gate "cannot flip to PASS purely from
plan text — the SQL must be authored and applied first." That conflates two separate gates. PVL
validates the **plan**; EVL validates the **implementation**. A plan that fully specifies Step B3b is
a complete plan, and authoring the SQL is EXECUTE's responsibility. Holding PVL open until code
exists would deadlock the loop, since no plan could pass validation before execution. Re-validation
proceeds on plan completeness.

## Routing decision for cycle 2

Re-validate only the two plans that carried FAIL-severity gaps:

- **Phase 01** — the original BLOCKED FAIL (`demo_hunt_leaderboard` base-table grants) must be
  confirmed cleared.
- **Phase 06** — the newly added project-ref FAIL must be confirmed cleared, and its stale
  CONDITIONAL contract replaced.

Phases 02, 03, 04 completed a full supplement cycle with every named gap applied as a checkable
checklist item and zero FAILs at any point. They are carried as CONDITIONAL-with-cycle-complete and
surfaced for explicit user acceptance at the EXECUTE gate, rather than consuming a second full
validation pass for low-yield confirmation. Phase 05 is PASS and needs nothing.

Plateau check: not triggered (cycle 1, gap count fell 18 → 2 open FAILs pending confirmation).
Cap check: 1 of 10 used.
Regression check: none — no previously-passing dimension regressed.
