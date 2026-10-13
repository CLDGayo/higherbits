---
name: phase02-runtime-diagnosis
type: REPORT
feature: higherbits-redesign
date: 2026-10-13
status: DONE_WITH_CONCERNS
---

# Phase02 local runtime diagnosis

TL;DR: Managed-sandbox native filesystem watching fails with EMFILE. Installed Next 15.3.9 uses Watchpack directory discovery; a bounded reproduction loses the existing root page under native watching and discovers it with process-local polling. Recommend `WATCHPACK_POLLING=1000` for a separately authorized next launch. PID3703 remains live and untouched. This report authorizes no second start.

## Confirmed evidence chain

1. At 2026-10-12T23:42:14Z, `lsof` identifies PID3703 cwd as this checkout's `apps/web`, listening on3101. Escalated PID-only `ps` identifies `next-server (v15.3.9)`, parent3694, start2026-10-13 08:37:13 JST. At23:44:14Z the same PID still listens.
2. The diagnostic shell has soft open-file limit1048575, hard unlimited. Launchd's default is256/unlimited; that default is NOT proof of PID3703's inherited limit. Kernel limits are184320 global and92160 per process, with19471 files open system-wide. PID3703 has26 numeric descriptors, highest26. Its exact inherited RLIMIT_NOFILE was not obtained; no claim that the shell or launchd default is its actual limit.
3. A fresh Node probe watches only `apps/web` and `apps/web/app`, closing both after100ms. Both return asynchronous EMFILE inside the managed sandbox. Identical probe with `require_escalated` closes both without errors. These are probe processes, not application replacements; no app/network request was made.
4. Installed bundled Watchpack, native directory mode, watching only `apps/web/app` with an ignore predicate admitting only the path to `page.tsx`:9 watcher errors, target absent from time-info entries after1200ms. Identical sandboxed probe with `WATCHPACK_POLLING=1000`:0 errors, target present with accuracy and timestamp. Both watchers close at1200ms. No file contents are read by these probes.
5. `apps/web/app/page.tsx` exists. Generated `.next/server/app-paths-manifest.json`, mtime23:38:31.374Z, contains only `/_not-found/page`; pages manifest is empty. This is compiled-output evidence, not by itself a complete dev-router inventory. No cache was removed or rewritten by the agent.
6. Installed `next/dist/server/lib/router-utils/setup-dev-bundler.js:234` creates Watchpack, then its aggregated callback derives routes from `getTimeInfoEntries()` and clears/rebuilds `appFiles`/`pageFiles` (around244–260). Around289 it skips entries without accuracy. Bundled `next/dist/compiled/watchpack/watchpack.js:1` maps `WATCHPACK_POLLING` to `options.poll`; polling bypasses native watchers. Native errors invoke `onDirectoryRemoved("watch error")`, marking discovered files/directories missing. The directory-mode reproduction demonstrates this precise discovery failure for the real root-page path without importing application source.

## Competing hypotheses and elimination

| Hypothesis | Test | Finding |
| --- | --- | --- |
| Genuine descriptor exhaustion requires raising limits | PID-only descriptor count, kernel usage, shell limits; identical two-watch probe outside sandbox | Not supported as the observed trigger: only26 descriptors in live server; fresh minimal probe fails only under sandbox. Increasing `ulimit` is not justified by this evidence. PID's inherited limit remains unmeasured. |
| Wrong checkout or deleted root route | Live PID cwd/listener; root-page existence; generated manifest keys | Wrong checkout/deleted page eliminated. Root source exists; runtime discovery is degraded. |
| Sandbox native-watch restriction disrupts Next route discovery | Identical native probe inside/outside sandbox; installed Watchpack native-versus-polling directory probe | Confirmed sandbox-dependent watch failure and reproducible missing root-page discovery. Polling resolves the isolated discovery failure. |

An earlier file-mode Watchpack control retained the target despite9 native errors; polling retained it with0 errors. Therefore EMFILE alone does not imply every watcher loses every file. Next's directory-discovery path is the relevant failing reproduction. Full-app root recovery remains unverified until an authorized launch and fresh readiness/gates; this diagnosis does not claim that every possible404 cause is eliminated.

## Timeline and evidence ownership

- Main/user reports original PID77729/session42142 terminal with native fatal stack, no listener, then the single authorized replacement session68756/PID3703. The old fatal cause, including any heap theory, remains unconfirmed here.
- PID-specific start timestamp:2026-10-12T23:37:13Z. Main reports Ready3.7s, many Watchpack EMFILE messages, initial5s HEAD timeout followed by root404 and `/_not-found` compilation. These logs were supplied by the user, not independently recovered here.
- Generated manifest timestamp23:38:31.374Z; only not-found compiled entry observed.
- Independent23:42–23:44Z diagnostics prove sandbox-dependent native-watch failure and isolated polling recovery. Current execution tool cannot poll main's handle68756: `Unknown process id 68756`. No inference of server termination follows; lsof proves the listener remains.
- Read-only inspection initially denied `ps`/`sysctl`; justified scoped escalation succeeded. No automatic-review rejection occurred.

## Minimum next action — proposed, not executed

Main/validator must authorize a second replacement explicitly: the existing recovery exception permits only ONE and expressly forbids a second. Leave live PID3703 alone until that decision. Once the coordinator separately confirms authorized lifecycle handling and port3101 free, run from this checkout root:

```sh
WATCHPACK_POLLING=1000 corepack pnpm --filter web exec next dev --port 3101
```

The1000 value is a one-second polling interval, supported by the installed bundled Watchpack and proven by the bounded sandboxed directory probe. No new descriptor limit or heap override is warranted. Keep inherited resource limits; do not use `launchctl limit`, persistent config, env-file edits, cache deletion, dependency install, or auth changes. Polling incurs recurring filesystem scans and up to roughly one polling interval of change-detection delay. This is a process-local workaround for the demonstrated sandbox watcher restriction, not proof of whole-app health.

Alternative, if validator prefers normal native watching: separately authorize the same ordinary Next command outside the managed sandbox. The two-directory native probe succeeded there, but the full app has not been tested there. Polling is the smaller permission change and has direct installed-directory-discovery evidence.

Coordinator retains the new handle/PID/cwd and bounded HEAD result, verifies successful root response rather than accepting any HTTP response, and inspects retained startup logs for watcher failure. Then independently rerun only the already-required PUBLIC-02/PROTECTED-02 confirmation under the existing contract. Earlier green migration/source/unit/full/browser evidence is carried only under unchanged-source/guard requirements; this investigation did not rerun or recertify those gates. No provider-only probes are authorized.

## Test Infra Gaps Found / risk handoff

The approved replacement allowance is consumed and current runtime does not meet readiness. Final PUBLIC/PROTECTED confirmation and Phase02 approval remain BLOCKED. No application implementation is proposed. Runtime/sandbox execution is a monitored high-risk surface even though this workaround changes only a local process invocation.

Diagnostic evidence and a stop-required risk/context handoff are colocated in `evidence/phase-02/runtime-diagnosis-13-10-26/`. Its `harness/risk-gate.json` has `mustStopBeforeFinalize: true`: no recovery-finalization or second launch until main/validator authorization and successful fresh runtime confirmation. Diagnostic reporting itself is complete. Verification/review/adversarial artifacts for this new proposal are intentionally pending. Existing task-root five records exist and remain untouched; their Phase01 decision is not reused as approval for this proposal or Phase02.

Recurrence prevention: require a bounded native-watch smoke probe under the actual launch permission profile before consuming a future replacement allowance, and treat Ready/listener-only evidence as insufficient when root discovery fails. No monitoring/source changes were implemented.

Unresolved: exact inherited PID3703 descriptor limit; original native-fatal cause; full-app polling recovery and final gate results. These do not weaken the reproduced sandbox-dependent watcher failure, but prevent claiming completed runtime recovery.

```text
FIX BOUNDARY:
affected_files: []
root_cause: Managed-sandbox native filesystem watching returns EMFILE; installed Next 15.3.9 directory discovery uses Watchpack, whose native directory-mode probe loses the existing root page. The same scoped directory probe discovers the page without errors using process-local polling.
proposed_fix: After main/validator explicitly authorize a second replacement and coordinator confirms port3101 free, launch from the same checkout with WATCHPACK_POLLING=1000 corepack pnpm --filter web exec next dev --port 3101; no source/config/cache/auth edits, resource-limit changes, or heap override.
risk_class: high
```

**Status:** DONE_WITH_CONCERNS
**Summary:** Sandbox-dependent watcher failure and bounded polling workaround proven; diagnosis only, live server untouched.
**Concerns/Blockers:** Second replacement needs main/validator authorization; runtime recovery and final PUBLIC/PROTECTED gates remain unverified.
