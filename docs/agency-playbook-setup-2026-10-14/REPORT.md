# Agency playbook installation and verification

Date: 2026-10-14 (Asia/Tokyo). Scope: HigherBits.dev app documentation and read-only verification. Result: **PASS — 9/9 actual named Agency agents assessed the playbook and completed bounded routing probes.**

## Installed documentation

- `AGENTS.md`: an early discovery pointer and revised existing Agency section; unrelated instructions preserved.
- `docs/AI_TEAM.md`: current workflow, correct nine-agent wording, updated verification status and evidence links; historical installation records retained.
- `docs/AGENCY_PLAYBOOK.md`: canonical all-nine initial assessment, relevant follow-through, exact names/status, RIPER/skill integration, role ownership, routing examples, non-recursive Agency dispatch, approval boundaries, failure handling and completion accounting.

All existing agent profiles, saved settings and application files were preserved. No dependencies, hooks, services, schedules or additional agents were introduced. Original AGENTS and team-guide backups are alongside this report. The playbook is repository guidance; it is not an enforcement hook.

## Live named-agent evidence

Normal desktop-bundled Codex CLI session, `--strict-config exec --sandbox read-only --model gpt-6-astra --json`; exit 0. The parent thread identifier is withheld from this public copy. Existing ChatGPT subscription sign-in used. The model option is a temporary request, not a backend identity attestation. Saved app `gpt-5.4` remains unchanged.

| Exact registered name | Result | Read-only routing probe | Child thread reference (redacted) |
|---|---|---|---|
| Senior Project Manager | PASS | Feature planning | `[redacted-private-thread-id]` |
| Senior Developer | PASS | Bug diagnosis | `[redacted-private-thread-id]` |
| UI Designer | PASS | Missing reference site | `[redacted-private-thread-id]` |
| UX Architect | PASS | Unclear improvement request | `[redacted-private-thread-id]` |
| Application Security Engineer | PASS | Simulated unavailable billing role | `[redacted-private-thread-id]` |
| Payments & Billing Engineer | PASS | Checkout and entitlements | `[redacted-private-thread-id]` |
| Accessibility Auditor | PASS | Dialog audit without source evidence | `[redacted-private-thread-id]` |
| Test Automation Engineer | PASS | Ingestion and TOML parsing | `[redacted-private-thread-id]` |
| Code Reviewer | PASS | Explicit skill routing and independent document review | `[redacted-private-thread-id]` |

Every child returned its live Agency app-contract/role headings, read the installed playbook, assessed relevance/contribution/dependencies for the documentation task and applied its assigned scenario. Parent activity records confirm real starts and completions; no child spawned another child. At most two smoke children ran concurrently. Parent-directed status/evidence messages are retained separately from spawn activity.

The Code Reviewer found no actionable contradictions in the current-policy scope. Test Automation Engineer used installed Python 3.11 and standard-library `tomllib`: 24 TOMLs parsed, 24 unique nonempty names, all nine exact Agency names present, exit 0. Individual commands, child results and activity references with private identifiers redacted are retained in [runtime-smoke-tests.json](runtime-smoke-tests.json); [runtime-events.jsonl](runtime-events.jsonl) contains the parent's terminal event stream; [smoke-prompt.txt](smoke-prompt.txt) records the exercised scope.

These live probes explicitly requested the nine roles. They establish real named loading and the exercised responses, not automatic routing for every possible future prompt. The unavailable-role fixture was simulated; the actual billing role loaded successfully. The explicit-skill fixture tested routing decisions without executing that skill.

## Static checks and independent review

- The top AGENTS pointer and team guide resolve to one canonical playbook. All ten canonical/discovery relative links resolve.
- Static boundary scenarios cover read-only, plan-only, stop, progress updates, scope changes, concurrency, explicit skills, child assignments, narrowed user participation and unavailable agents. These are text-based coverage checks, not live stop/cancellation or capacity-failure tests.
- Scoped protocol-wiring audit passed before and after. The scoped tracked-file `git diff --check` passed; separate whitespace checks cover the new untracked documents at closeout.
- Existing parity results were unchanged: nine intentional missing Claude mirrors for Codex-only Agency roles, plus 18 preexisting warnings.
- Existing skill-invocation validator results were unchanged: 42 references to existing VC agents are misclassified by its incomplete agent allowlist; every flagged name has existing Claude and Codex files.
- Independent staging/script review found no actionable issues. Mandatory VC phase fanouts remain governed by their existing contracts; only recursive Agency triage/duplicate Agency dispatch is prohibited.

Detailed before/after results and classifications are in `audit-before/` and `audit-after/`. This is a targeted audit, not a full harness PASS or an unrelated harness cleanup.

## Preservation and known limits

[verification.json](verification.json) records the final preservation checks: all 24 Codex and 15 Claude profiles byte-identical, selected project/global settings byte-identical, Git HEAD/index and unrelated tracked diff hashes unchanged, and metadata for 1,508 preexisting untracked files preserved (the authorized guide edit is excluded). Untracked preservation uses size/mtime, not content hashes. Saved permissions/MCP/model configuration was not edited. Sign-in was checked through `codex login status`, without accessing credential contents.

The parent found an existing missing `RTK.md`; Senior Developer found the existing absent `docs/01-architecture-and-stack.md` context target. These failed reads are retained; neither prevented the bounded smoke. Some long supporting context/SOP reads were truncated; the tester successfully reread the SOP. No invocation retries or parser failures occurred. Billing also inspected the existing provider guard source; this was read-only and no financial action was attempted.

No product tests/builds, browsers, servers, assistive-technology checks, live ingestion, billing/provider calls, production operations, commits or pushes were performed. No claim is made about application correctness, security, billing behavior or accessibility conformance. Future CLI use still requires a compatible explicit model override while the saved unsupported `gpt-5.4` setting is preserved; already-running chats may need to reload the playbook or use a fresh app-repository session.

## Example requests

1. “Create a saved-components feature using the existing design system. Define scope and acceptance criteria first.”
2. “Inspect this site's filtering experience and propose how to adapt it to HigherBits. Keep this read-only.”
3. “Ingest these selected creators through our pinned ingestion SOP and authorized batches; report published and held items with evidence.”
