# HigherBits.dev Codex Development Team

> **Current workflow — 2026-10-23:** Use project-local ICM at `.agents/skills/icm/SKILL.md` when present; otherwise follow [AGENTS.md](../AGENTS.md) and the task’s governing plan for staged work and selective evidence handoffs. This independently installed Agency policy and all nine profiles remain in force. Governing plans retain their acceptance criteria, required independent review and action-time approvals. General VC actor routing and mandatory kit fanouts are retired; dated setup evidence remains historical.

Setup: 2026-10-13; expanded 2026-10-14 (Asia/Tokyo). **Agent installation: complete — all nine Agency agents passed the dated read-only profile smoke tests recorded below. Playbook verification: PASS — all nine real named agents completed the read-only routing smoke; static boundary/link checks passed. See the separate evidence below for scope and existing harness warnings.** The canonical workflow is [AGENCY_PLAYBOOK.md](AGENCY_PLAYBOOK.md); playbook evidence belongs in `docs/agency-playbook-setup-2026-10-14/`. Saved app settings remain unchanged.

## Project and preserved environment

This installation belongs to `<app-root>`, the actual app, not the Second Brain vault. Branch: `main`; app HEAD at setup: `b8b7cf64c5e99e7c8b6a3262a87d9016843c54a2`. Existing application and agent work remains uncommitted and untouched. No application code, dependencies, lockfiles, auth stores, MCP connections or Codex settings were modified.

Codex desktop-bundled CLI: `0.162.0-alpha.17.2`, local macOS. `codex login status` confirmed **Logged in using ChatGPT**. The app's existing `.codex/config.toml` is unchanged: `gpt-5.4`, medium reasoning, on-request approval, workspace-write sandbox, network access enabled. The previous vault test established that `gpt-5.4` is unsupported with ChatGPT sign-in. To preserve this app's saved settings as requested, the completed smoke tests used a temporary `--model gpt-6-astra` override. No API keys, alternate providers, billing fallback, permission relaxation or tool upgrade was introduced.

## Roster

All paths below are relative to this app root. Actual TOML names are used for real custom-agent delegation.

| Name | Installed file | Upstream source |
|---|---|---|
| Senior Project Manager | `.codex/agents/senior-project-manager.toml` | `project-management/project-manager-senior.md` |
| Senior Developer | `.codex/agents/senior-developer.toml` | `engineering/engineering-senior-developer.md` |
| UI Designer | `.codex/agents/ui-designer.toml` | `design/design-ui-designer.md` |
| UX Architect | `.codex/agents/ux-architect.toml` | `design/design-ux-architect.md` |
| Code Reviewer | `.codex/agents/code-reviewer.toml` | `engineering/engineering-code-reviewer.md` |
| Test Automation Engineer | `.codex/agents/test-automation-engineer.toml` | `testing/testing-test-automation-engineer.md` |
| Application Security Engineer | `.codex/agents/application-security-engineer.toml` | `security/security-appsec-engineer.md` |
| Payments & Billing Engineer | `.codex/agents/payments-billing-engineer.toml` | `engineering/engineering-payments-billing-engineer.md` |
| Accessibility Auditor | `.codex/agents/accessibility-auditor.toml` | `testing/testing-accessibility-auditor.md` |

At the 2026-10-13/14 installation, these nine Codex specialists were added alongside the then-existing 15 VC agents. The 2026-10-23 workflow migration removed the main repo's VC profiles and preserves all nine Agency profiles. Global agents remain outside this migration's scope; the dated setup evidence below records the earlier state.

## Stack adaptation

Current files establish pnpm `8.15.6`, Turborepo workspaces (`apps/*`, `packages/*`), Next.js `15.3.9` App Router, React/React DOM `19.1.0`, TypeScript and `@/*` aliases in `apps/web`. Existing server/client boundaries, Clerk authentication and Supabase/data integrations remain authoritative. No database or paid service was accessed.

The UI profiles preserve Tailwind 3, shadcn `new-york`/neutral with CSS variables, Radix primitives, `components/ui`, `app/globals.css` semantic tokens, existing typography/breakpoints and the `next-themes` provider. They require approval before substantial changes and cover responsive behavior, accessibility and loading/empty/error/success states. They do not impose a new visual system, framework or theme toggle.

PM, Developer and UX Architect replace upstream framework/path mandates with focused app duties, scope/acceptance criteria and current architecture. UI, Reviewer and Tester retain upstream guidance with a preceding app contract overriding generic defaults. Reviewer remains independent and read-only, with severity and file/line findings. Tester uses existing scoped Vitest, TypeScript, Playwright and Axe checks, distinguishes executed from proposed checks and never invents evidence. No Laravel/Livewire/FluxUI architecture, speculative premium effects or mandatory CI rewrite is introduced.

Verified commands from `apps/web/package.json` (documented, **not executed as product checks**):

```bash
corepack pnpm --filter web test <scoped-test-path>
corepack pnpm --filter web typecheck
corepack pnpm --filter web test:a11y
```

The current script is `typecheck`; some historical docs say `type-check`. Playwright can launch a dev server, so it is excluded from installation smoke tests. The context router's `docs/01-architecture-and-stack.md` target is absent, and this app has no `process/development-protocols/capability-use.md` or `AGENT_CONTRACT.md`; imported profiles do not assume those vault-specific files exist. Existing Graphify report was inspected; no graph rebuild or unrelated context repair occurred. Current rebrand compatibility identifiers must be preserved.

## Workflow

Follow [AGENCY_PLAYBOOK.md](AGENCY_PLAYBOOK.md) for automatic routing. The primary Codex session obtains a real bounded assessment from all nine Agency agents for each substantive project request, then continues with the relevant specialists. It uses the optional project-local ICM skill (`.agents/skills/icm/SKILL.md`) to coordinate bounded stages, skill invocation, governing approval gates and existing task records, names actual queued/running/completed/blocked agents, and reports participation evidence and the next action. Removed VC actors and mandatory kit fanouts are no longer routing dependencies. Existing task-specific acceptance criteria and required independent reviews remain in force. Children never repeat the all-nine assessment; simple replies and progress updates do not restart it.

Example requests (Codex chooses agents and the next authorized steps):

1. “Create a saved-components feature using the existing HigherBits design system. Define the scope and acceptance criteria before implementation.”
2. “Inspect this site's filtering experience and propose how to adapt it to HigherBits. Keep this read-only.”
3. “Ingest these selected creators using our existing pinned ingestion SOP and authorized batches; report published and held items with evidence.”

Playbook installation verification is recorded separately from historical agent setup under `docs/agency-playbook-setup-2026-10-14/`. Current status is at the top of this guide. Agent availability and routing are checked through real runtime evidence; no prompt-only guarantee is claimed.

## Provenance, modifications and backups

Upstream: [msitarzewski/agency-agents](https://github.com/msitarzewski/agency-agents), pinned commit `f99f6aa910a442b0197b768ce0ea7751e35e2060`. Reused the previously reviewed separate checkout `/private/tmp/agency-agents-20261013` and its generated Codex artifacts. Source instructions, scripts, script help and official Codex schema were reviewed in this setup session; no third-party source/script was changed. The documented conversion generated only Codex artifacts in the temporary checkout. Upstream installer dry-run selected only six agents in copy mode; reviewed path resolution gives explicit `--path` precedence; actual installation output confirmed this app destination.

```bash
PROJECT_ROOT='<app-root>'
TEAM_FILE='/private/tmp/agency-agents-app-setup/team.txt'
bash ./scripts/install.sh --tool codex --agents-file "$TEAM_FILE" --path "$PROJECT_ROOT/.codex/agents" --dry-run
bash ./scripts/install.sh --tool codex --agents-file "$TEAM_FILE" --path "$PROJECT_ROOT/.codex/agents"
```

The public branch retains upstream originals, selection identifiers, manifests, licenses and verification results. Before-edit AGENTS/AI_TEAM snapshots are omitted; the untouched source checkout retains those originals.

## Verification and approved runtime-test payload

Static checks passed: all 21 TOML profiles parse, required fields are nonempty, names are unique and all six additions contain only `name`, `description`, `developer_instructions`. Existing 15 agents and project config are byte-identical. Original AGENTS.md bytes remain an exact prefix. Unrelated tracked and staged diffs are unchanged; size/mtime metadata for 1,477 pre-existing untracked files is preserved. Installed profiles match manifest hashes. No commit, push, deployment or app code change occurred.

The VC agent-parity audit exits 1 solely for six missing Claude mirrors, consistent with the explicit Codex-only scope; existing 15 pairs retain pre-existing warnings. No Claude mirrors or unrelated audit repairs were added. The full VC harness audit and app product tests were not run. Official format: [Codex custom agents](https://learn.chatgpt.com/docs/agent-configuration/subagents); sign-in distinction: [authentication](https://learn.chatgpt.com/docs/auth).

Automatic approval review initially rejected transmission of app profiles/configuration without explicit payload/destination authorization. The user subsequently explicitly approved the listed files and signed-in Codex destination. The authorized test completed in a fresh normal CLI session with `--strict-config exec --sandbox read-only --model gpt-6-astra`; exit code **0**. No saved model/provider/permission setting was changed.

**All six actual custom agents passed, sequentially:** Senior Project Manager, Senior Developer, UI Designer, UX Architect, Test Automation Engineer and Code Reviewer. Each returned first heading `## HigherBits.dev app contract (2026-10-13)` from its own live developer instructions and its actual role heading. Each installed profile's SHA-256 matched the manifest. PM confirmed scope/approval/handoffs; Developer confirmed stack fit and no framework imposition; UI and UX confirmed existing design-system preservation, responsive/accessibility/states and design approval boundaries. Tester parsed all six TOMLs, confirmed unique names and only the three supported fields, and checked commands against manifests. Reviewer independently checked all six hashes and app stack/design/test configuration and reported **no actionable findings**.

Parent thread identifier is withheld from this public copy. Bounded results are saved in `runtime-smoke-tests.json`; private thread identifiers are redacted in this public copy. Tester's initial parser commands failed (exits 1/1/127); a fallback using the existing vendored TOML parser passed (0). Read-only protections blocked incidental temp/cache writes; no dependencies were installed. These failures are retained in the evidence. No app tests/builds, browser/server startup, external tools, production operations, credential stores or env-file reads were performed. Successful invocation establishes custom-profile loading and bounded static compatibility, not product behavior or backend-model identity attestation. Playwright artifacts are not universal: some projects disable global trace/screenshot settings.

Final preservation checks passed: saved Codex config remains byte-identical; all 15 existing agent profiles and all six installed profile hashes are unchanged; unrelated tracked/staged diff hashes are unchanged; original AGENTS.md remains an exact prefix; metadata for the same 1,477 pre-existing untracked files is preserved. ChatGPT sign-in was separately confirmed with CLI login status. No restart or manual authentication was needed for the fresh CLI tests. Already-running chats may need a fresh session for discovery. The app's saved `gpt-5.4` setting remains as requested, so future CLI work needs a compatible explicit model override unless the user later authorizes a saved-model change.

Explicitly approved payload (paths relative to this app):

- The six installed `.codex/agents/*.toml` files in the roster.
- The appended Agency Agents App Development Team section of `AGENTS.md` and `docs/agency-agents-setup-2026-10-13/manifest.json`.
- `.codex/config.toml`, `package.json`, `pnpm-workspace.yaml`, `apps/web/package.json`.
- `apps/web/components.json`, `apps/web/tailwind.config.js`, `apps/web/app/globals.css`.
- `apps/web/vitest.config.ts`, `apps/web/playwright.config.ts`, first lines of existing `graphify-out/GRAPH_REPORT.md`.

Codex itself also loads applicable existing project instructions as normal session context. The proposed files may contain internal project details; no credentials or env files are part of the payload.

## Update or remove

Back up current local profiles outside `.codex/agents/` before updating. Review a newly pinned upstream checkout, convert only for Codex, install the selection to a temporary staging directory, then compare old originals/new upstream/current local profiles and merge deliberately. Preserve this app contract. Revalidate TOML and hashes and run approved read-only named-agent checks. Never run bare installer defaults over customized files or configure auto-updates.

To remove any selected profiles, first preserve later customizations and identify the exact group from its manifest (the original six or the three-specialist expansion). Revise the playbook roster, required-participation policy and guide together so they do not require removed agents. For complete Agency removal, also remove only the top Agency coordination pointer and labeled Agency team section from AGENTS.md, then archive/retain the playbook and provenance deliberately. Do not restore AGENTS.md.before wholesale over later changes. Keep other agents, settings, app code and work in progress intact. No saved model change is part of this installation.

## Specialist expansion — 2026-10-14

Added three app-scoped specialists from upstream commit `4bce55aa8b97385a5ad7b37d09b44ab976b96573`. Original six remain at their recorded revision and all 21 existing agents are preserved. The documented upstream Codex conversion/selection/dry-run/install scripts were reused; their bytes matched the previously reviewed scripts. Only the three verified identifiers in the new selection file were installed. No other integration, application feature, production operation or dependency change is part of this setup.

Local adaptations: AppSec uses the existing Clerk/Next.js trust boundaries and approved secrets delivery rather than imposing a secrets manager, scanner or CI rewrite. Billing preserves Lemon Squeezy/Stripe ownership and entitlement contracts and requires separate approval for live financial/provider operations. Accessibility reuses existing Playwright/Axe and components; reports manual/AT gaps as NOT TESTED instead of inventing findings, percentages or conformance. All three inherit the existing app contract and saved settings; setup tests cannot authorize remediation, browser/server startup, paid services or production changes.

The local specialist setup retains before-edit snapshots, omitted from this public branch; original agent files, manifests, licenses and verification results remain included.

Specialist invocation examples:

- “Delegate to Application Security Engineer for a read-only review of this approved upload/publish change. Report evidence and trust-boundary gaps; do not remediate.”
- “Have Payments & Billing Engineer review provider ownership and duplicate/out-of-order webhook fixture scenarios without contacting live providers.”
- “Have Accessibility Auditor assess this scoped journey using existing tools. Separate actual manual/automated evidence from NOT TESTED criteria.”

Updates/removal follow the staging-and-backup rules above. The original six-manifest covers the initial group; the specialist manifest covers these three. Back up local customizations before updating. To remove only the expansion after authorization, delete the three specialist TOMLs and revise their roster/routing entries and the playbook participation requirement to six without overwriting later unrelated changes. Keep original agent settings and provenance. Do not restore backup files wholesale over newer work.

Specialist runtime verification **passed** through a normal signed-in Codex CLI session with `--strict-config exec --sandbox read-only --model gpt-6-astra`, exit 0. Each actual named specialist returned `## HigherBits.dev app contract (2026-10-14)` from its own live instructions plus its role heading, and its installed SHA-256 matched the manifest. AppSec verified all three TOMLs parse, names are unique and only required fields are present; Billing confirmed dual-provider/entitlement boundaries and action-specific approval; Accessibility confirmed existing tooling/design fit and explicit NOT TESTED manual-AT gaps. Initial AppSec shell/parser attempts failed under read-only restrictions; successful installed Python 3.11/std-library parsing and all actual outcomes are preserved in `runtime-smoke-tests.json`. No dependencies were installed.

Parent thread identifier is withheld from this public copy. Setup reads used only the three new profiles/manifest, labeled AGENTS team section and the app configuration payload approved earlier in this conversation. No additional app source, env files, credential stores, live providers, browser/server startup, product tests or mutations were used. Live instruction evidence establishes actual custom-agent loading; it does not establish application security, billing correctness, accessibility conformance or backend-model identity.

Final checks confirmed all 21 pre-existing profiles and saved Codex config byte-identical, unrelated tracked/staged diff hashes unchanged and pre-existing untracked file metadata unchanged except the authorized guide edit. Backups preserve the original guide and AGENTS file. Existing original-six provenance remains untouched. The agent-parity audit reports nine expected missing Claude mirrors (the six original Agency profiles plus these three); no other integrations were added to satisfy it. Full VC harness audit/product tests were outside scope.

No restart or manual authentication was required in fresh CLI sessions. The app's saved `gpt-5.4` setting remains unchanged as requested; use a compatible temporary override for future CLI work unless a later saved-model change is authorized. A fresh chat may be needed for an already-running app session to discover these profiles.

## Playbook verification — 2026-10-14

Implemented the canonical [Agency playbook](AGENCY_PLAYBOOK.md), an early AGENTS.md discovery pointer and the revised team workflow. The nine Agency profiles and all existing VC agents were preserved. Every substantive request receives actual bounded all-nine assessment; only relevant specialists continue. Existing RIPER owners/gates and mandatory VC fanouts remain intact; children cannot restart Agency triage.

**9/9 actual named-agent smoke tests passed** using the existing ChatGPT sign-in, temporary `--model gpt-6-astra` and `--sandbox read-only`; the normal CLI session exited 0. Each child read the installed playbook, identified its live profile headings, assessed the documentation task and answered a distinct routing probe. Parent thread identifier is withheld from this public copy. The tests covered features, bugs, reference sites, unclear requests, a simulated unavailable role, billing, accessibility audits, ingestion and explicit skills. No hypothetical product task was executed.

Full results, actual child IDs and terminal results are in [runtime-smoke-tests.json](agency-playbook-setup-2026-10-14/runtime-smoke-tests.json); [verification.json](agency-playbook-setup-2026-10-14/verification.json) records preservation checks. [The report](agency-playbook-setup-2026-10-14/REPORT.md) distinguishes live routing evidence from static coverage and product behavior. Setup manifest and before-edit backups are retained in that folder.

Static checks covered read-only/plan-only/stop boundaries, status follow-ups, scope changes, concurrency, skills, child delegation, user-narrowed participation and unavailable-role handling. All ten canonical/discovery links resolve. Scoped protocol wiring and changed-file whitespace checks passed. Existing audit results were unchanged: nine intentional missing Claude mirrors plus 18 warnings; 42 references misclassified by the existing skill validator's incomplete agent allowlist. These are not a full harness PASS.

Known limits: `RTK.md` and the context router's architecture target were already absent; failed reads are recorded without unrelated repairs. Some source/context outputs were truncated. The unavailable-agent fixture was simulated, not an actual role outage. This test confirms named loading and bounded routing responses, not enforcement for every future request or product security, billing, accessibility or functionality. Product tests/builds, browser/server startup, screen-reader testing, live financial actions and production operations were not run. Existing saved model/settings and sign-in were preserved; future CLI use still needs a supported explicit model override while the saved `gpt-5.4` setting remains unchanged.
