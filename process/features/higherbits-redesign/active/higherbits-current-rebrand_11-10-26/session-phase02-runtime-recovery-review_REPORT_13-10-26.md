---
name: phase02-runtime-recovery-review
description: Bounded manual runtime recovery exception; authorization-ready, not EVL approval.
type: REPORT
feature: higherbits-redesign
date: 2026-10-13
status: DONE
---

# Phase02 bounded runtime recovery review

**Decision: authorization-ready for ONE coordinator-owned manual replacement on3101; no process started here. Final EVL remains BLOCKED pending fresh PUBLIC/PROTECTED proof and owner reconciliation.**

## Scope and authority

Task, target, output, constraints and success criteria are explicit: amend only the selected Phase02 plan's inline contract and this process report, review a reversible local recovery, then stop until main supplies replacement handle/readiness. User's2026-10-13 instruction explicitly authorizes application of this exception; no additional human approval is invented. This is a narrowly accepted contract amendment, not a repeat V1–V7 PVL, overwrite of prior findings, new source authorization or production approval. Relevant helpers applied: graphify, vc-intent-clarify, vc-context-discovery, vc-plan-discovery, vc-review-situation and vc-risk-evidence-pack. No Vercel/deployment access skill applies to local Next recovery. No specialist/subagent tool is available; no independent fan-out claimed.

Selected plan: `phase-02-first-party-identifiers_PLAN_12-10-26.md`, inline `Runtime Recovery Exception — 2026-10-13`. Existing source allowlist remains18, no source/API/auth edits. Existing failed evidence and `session-phase02-final-evl_REPORT_13-10-26.md` are preserved unchanged.

## Terminal evidence and limits

- Main's recovery audit, supplied directly by user: original server exec session42142 polled TERMINAL, wrapper exit0, Node native fatal stack; lsof3101 and former PID77729 absent. This is terminal failure, not observation timeout. Full original stack remains main-owned; reviewer has not independently inspected it and does not assert heap exhaustion.
- Reviewer repeats read-only checks: `lsof -nP -iTCP:3101 -sTCP:LISTEN` no output; `lsof -a -p 77729 -d cwd` no output; bounded curl HEAD connection-refused/exit7. Sandbox denies `ps`; no process-liveness inference rests on that denied command. Main's terminal report is the positive session-terminal evidence; repeat port/cwd absence and refusal corroborate unavailable runtime.
- Existing final PUBLIC suite timed out at300s with0 completed/16 skipped; PROTECTED14 failed connection-refused. Neither becomes green because a recovery is authorized. Original wrapper exit0 does not erase native fatal diagnostics or failing gate outcomes.

## Bounded command and risk review

| Dimension | Finding | Fence / evidence |
|---|---|---|
| Infra fit | PASS for authorized attempt | Installed `apps/web/package.json` dev entrypoint is `next dev`; root command `corepack pnpm --filter web exec next dev --port 3101` selects this workspace. Recheck port free immediately before launch and retain handle/PID/cwd. Never `e2e:server`, which targets3100. No dependency install or shared config edit. |
| Test coverage | PASS for recovery design, runtime proof pending | Existing regression wrapper inspected: unconditional `webServer: undefined`, retries0. Same PUBLIC/PROTECTED commands,300000ms each, sequential isolated outputs; genuine admin/Axe/native PNG proof still required. Passing315/129/1214/118 carry only if source/guards unchanged. |
| Breaking changes | PASS for bounded process-only scope | No source/config/schema/caller or test changes; no kills, live-process restart, port reassignment or retry loop. One replacement only after original terminal and port freedom; failure remains BLOCKED. |
| Security surface | PASS within explicit consent | Normal authorized app env loading and ordinary authorization requests only. No agent secret-file/state-content access, credential dump, auth bypass, provider-only probe, submission/account mutation or deployment. Private state metadata only. |

Heap option: process-local `NODE_OPTIONS=--max-old-space-size=6144` is permitted ONLY if actual retained original diagnostics establish heap exhaustion. This review does not establish that condition. Never print inherited environment, modify `.env` or persist heap config. Resource-use residual remains; this option is not a guarantee against another fatal error. Development runtime can create normal generated caches and make ordinary app requests; these operational effects are within the user's explicit local-app recovery consent, not permission for provider experiments or durable source changes.

## Handoff / stop condition

Coordinator may now make the single authorized launch after an immediate port-free check. Reviewer stops here: no launch, kill, browser or gate rerun performed. Await main's new handle, correct-checkout cwd/PID and bounded HEAD readiness; then affected independent confirmation runs ONLY PUBLIC-02 and PROTECTED-02 with new unique outputs. Preserve earlier failures and record any new failure. No fresh UNIT/FULL/BROWSER sweep without relevant source drift. Owner reconciles packet later; do not edit its five records now, change declared lowercase schema or claim both validators pass. Phase01 root packet remains untouched, and Phase02 rejected/must-stop/EVL BLOCKED remain until all required evidence passes and owner UPDATE PROCESS completes.

## Final mechanical checks

- `node .claude/skills/vc-generate-plan/scripts/validate-plan-artifact.mjs <selected-plan>`: exit0,0 failures,0 warnings after amendment. `git diff --check` on the two authorized process paths: exit0.
- Independently recomputed all887 hashes from `evidence/phase-02/final-evl-13-10-26-6f21b8/source-after-all.json`:0 drift. All20 `carry-guards-audit.json` guard hashes:0 drift, including Phase01 root packet and read-only auth/config guards. No secret/state-content probe.
- Original final EVL report hash remains `db3ab0a589959029dd02ad3859a3e6d39fc5971c99cf8d3c75498b49735cfc7b`; failed evidence remains preserved. These checks prove amendment structure/current integrity, not runtime readiness or EVL PASS.

## Polling correction review — later2026-10-13 amendment

**Authorization-ready:** coordinator may gracefully Ctrl-C ONLY owned handle68756/PID3703, await authoritative session TERMINAL AND free3101, then launch ONE process-local polling replacement. This explicitly supersedes this report's earlier one-attempt-only stop condition for this named lifecycle operation, not for any unowned process or further retry. User explicitly requested application; no extra approval question is needed.

Read the full `session-phase02-runtime-diagnosis_REPORT_13-10-26.md` and both diagnostic records in `evidence/phase-02/runtime-diagnosis-13-10-26/harness/`. Reported bounded native-watch probes fail only in sandbox; reported installed Watchpack directory probe has9 errors/missing root natively versus0 errors/root discovered with polling1000. These are debugger-recorded results, not probes independently rerun here; the diagnostic records contain summarized results, not a complete raw terminal transcript. Reviewer inspected installed Next directory-discovery callback rebuilding route sets from Watchpack time-info entries, and independently reconfirmed PID3703 listener3101/cwd exactly this checkout's apps/web. Full-app polling health remains unproven. Diagnostic risk-gate remains high/must-stop; its pending verification/review/adversarial records are not fabricated or converted into completed risk approval by this process-only amendment.

| Dimension | Bounded amendment finding |
|---|---|
| Infra fit | PASS for attempt: installed Next/Watchpack mechanism and debugger's bounded polling reproduction support `WATCHPACK_POLLING=1000 corepack pnpm --filter web exec next dev --port 3101`. Actual root200 still required; Ready/listener/root404 insufficient. |
| Test coverage | PASS for unchanged recovery run-set, not runtime result: preserve failures; new PUBLIC/PROTECTED native confirmation only after readiness/source reconciliation, same300000ms/privacy/config. |
| Breaking changes | PASS for process-only scope: graceful Ctrl-C via owned handle only, authoritative terminal plus free port before one start; no force-kill fallback, source/config/cache changes or third launch. |
| Security surface | PASS within explicit lifecycle consent: no auth/provider/secret probes, heap/FD changes or permission-profile workaround. Existing app-internal env loading remains distinct from agent secret access. |

Risk residuals: diagnostic risk classification remains high for runtime/sandbox execution; bounded reversible authorization is not a downgrade. Polling filesystem overhead/delay remains; shell limit1048575 is NOT established as PID3703's inherited limit.26 descriptors and sandbox-dependent minimal reproduction do not justify raising limits. Earlier native fatal/heap cause remains unconfirmed. Exact owned-handle identity must be confirmed by coordinator immediately before Ctrl-C; reviewer cannot attest main's execution-handle mapping from lsof alone. If identity differs, terminal cannot be confirmed, port remains occupied, or polling fails, stop without another lifecycle action.

Selected plan's `Polling Correction Addendum` records this exact exception and precedence over prior no-live-stop/no-second-start wording. Original recovery attempts, final EVL report and failed raw evidence are preserved. Reviewer performs no Ctrl-C, launch, HTTP/browser or gate run. Wait for main's polling handle/readiness; Phase02 EVL/approval remain BLOCKED pending actual PUBLIC/PROTECTED and owner reconciliation.

Post-addendum mechanical checks: plan validator exit0,0 failures/0 warnings; scoped diff-check exit0. Recomputed887 source hashes and20 guards again:0 drift. Original final EVL report still hashes to `db3ab0a589959029dd02ad3859a3e6d39fc5971c99cf8d3c75498b49735cfc7b`. Phase01 packet remains unchanged.

**Status:** DONE
**Summary:** Bounded recovery exception is authorization-ready under explicit user consent; waiting for main's replacement handle/readiness.
**Concerns/Blockers:** Runtime gate evidence remains failed; heap diagnosis unconfirmed by reviewer. No Phase02 approval/status change.
