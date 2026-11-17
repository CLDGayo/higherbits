# HigherBits.dev Agency Agents Playbook

> **Current workflow — 2026-10-23:** Use project-local ICM at `.agents/skills/icm/SKILL.md` when present; otherwise follow [AGENTS.md](../AGENTS.md) and the task’s governing plan for staged work and selective evidence handoffs. This independently installed Agency policy and all nine profiles remain in force. Governing plans retain their acceptance criteria, required independent review and action-time approvals. General VC actor routing and mandatory kit fanouts are retired; dated setup evidence remains historical.

Effective 2026-10-14. This is the canonical Codex routing playbook for the actual HigherBits.dev app. [AI_TEAM.md](AI_TEAM.md) holds the installed roster, profile paths, setup history and verification records. The primary Codex session owns coordination and the final result; the user describes the outcome in ordinary language.

## When this runs

For **every substantive project request**, the primary session MUST obtain a bounded, read-only initial assessment from **all nine actual named Agency agents** before committing to the implementation approach. This includes features, bugs, reference-site recreation, ingestion, refactoring, audits, explanations requiring investigation and substantive skill-driven work. All nine assess relevance; only relevant agents continue afterward. This interprets the profiles' relevant-specialist guidance as relevant follow-through after the user-required all-nine assessment.

Greetings, acknowledgments, simple factual replies and status questions need no new triage. Continuing the same task, executing a command, entering another task stage or resuming after compaction does not restart it. Reuse verified prior assessments and evidence for the same scope; reassess only affected roles when scope changes. A genuinely new substantive task starts a new nine-agent assessment. A direct request to one agent still receives bounded team triage unless the user explicitly narrows participation; report that exception, never call it 9/9.

**This is a primary-session rule.** Every delegated assignment is a bounded child task and MUST NOT start another all-nine assessment. Agency children do not delegate. Pass existing assessments and needed specialist results to the assigned task owner; the primary session schedules any further specialist work required by the governing plan. Reuse completed evidence and avoid duplicate assignments. A profile's presence, a proposed assignment, simulated role text or an attempted spawn without a result never counts as participation.

## Start, assign and continue

1. Confirm the app root and active task scope, honor the user's read-only/plan-only/stop boundaries, inspect the existing graph report/query as required by AGENTS.md, and consult [the context router](../process/context/all-context.md) plus relevant deeper files. Reuse the existing plan/task record and already granted authorization. Ask only when missing information materially affects the result; gather independent information meanwhile.
2. Check the runtime's callable agent names and current concurrency limit. Use the exact names in the ownership table below; retain invocation IDs. Queue agents beyond available slots, accounting for the coordinator and any already-running agents. If the limit is unknown, start sequentially. Do not change settings, permissions or models to create capacity.
3. Announce the goal and the initial queued/running assignments truthfully. Give all nine the same concise outcome, scope and boundaries plus only the evidence relevant to their role. Initial assessments are read-only: no edits, live provider calls, deployments, purchases, browser/server startup or product-test execution. They identify needed investigation/checks; deeper work receives a separate scoped assignment.
4. Collect each agent's relevance decision, next contribution, dependencies and concerns. Default to one short response per agent, about 150 words or fewer; do not turn triage into nine full audits. Accept “No further involvement needed — [specific reason]” only from the actual agent. Count an incomplete or blocked response separately.
5. Senior Project Manager synthesizes acceptance criteria and dependencies; Codex reconciles disagreements using evidence and chooses the next authorized step. Use ICM to define the current stage and preserve the governing plan's gates. Identify a lead and bounded deliverables for further relevant work, then continue without asking the user to pick agents or repeat existing authorization.
6. Give each implementation owner non-overlapping files or a clear sequential handoff. Reviewers remain independent of their own implementation. Schedule relevant testing and review after the necessary evidence exists, resolve findings within scope, and report completion against acceptance criteria. A missing specialist or test leaves an explicit gap.

Use the task's existing `process/` record for a compact participation table (or the conversation for a task without a durable record):

| Exact agent name | State | Invocation ID / evidence | Assessment and next contribution |
|---|---|---|---|
| One row per required agent | queued / running / completed / blocked | Actual tool reference or child ID; pending until real | Relevant work, no further involvement with reason, or unresolved gap |

Update the table at meaningful milestones. `queued` means planned but not started; `running` requires a successful invocation; `completed` requires a returned bounded result; `blocked` records the missing prerequisite or failed invocation. Preserve subagent result codes `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, `NEEDS_CONTEXT` and resolve correctness concerns before advancing. “9/9 assessed” requires nine successful real assessments, not nine names or attempts. Track later implementation/review results separately from assessment completion.

## Agency ownership within the task

| Exact callable name | Contribution after the initial assessment |
|---|---|
| Senior Project Manager | Outcome, acceptance criteria, dependencies, task handoffs and the next step. Supports the existing plan record and its named owners and required independent review. |
| Senior Developer | Feasibility, current-stack investigation and approved implementation within assigned files. Works within the governing plan, assigned stage and authorized write scope. |
| UI Designer | Visual design and responsive states using existing HigherBits components, tokens and brand. |
| UX Architect | User journeys, navigation, interaction behavior and loading/empty/error/success flows. |
| Code Reviewer | Independent read-only review of completed changes, with severity and file/line evidence. Never invent independent review or approve its own edits. |
| Test Automation Engineer | Existing scoped verification, meaningful regression coverage and actual pass/fail/not-run evidence. |
| Application Security Engineer | Clerk/Next.js authentication, authorization, ownership, uploads, integrations and data-exposure boundaries; read-only findings before approved remediation. |
| Payments & Billing Engineer | Lemon Squeezy/Stripe ownership, subscriptions, checkout, webhooks and entitlements; use fixtures before separately authorized live financial operations. |
| Accessibility Auditor | Keyboard/focus, semantics, contrast, states and assistive-technology considerations. Separate automated evidence, actual manual checks and NOT TESTED criteria. |

Use the optional project-local ICM skill (`.agents/skills/icm/SKILL.md`) to locate the governing plan, select stage inputs, assign bounded work and record evidence. Reuse the existing task folder and named ownership. The main session remains the single Agency scheduler; task owners request further specialists through it. Preserve all task-specific ordering, acceptance criteria, required independent reviews and action-time approvals. The [legacy protocol router](../process/development-protocols/all-development-protocols.md) remains available only for interpreting existing contracts and historical evidence. Do not invoke removed VC actors or skills. If a governing plan names an unavailable required validator or role, record the gap and establish an equivalent check or authorized assignment before claiming that gate. Workflow migration cannot waive an obligation or count as product acceptance.

Explicit skill requests MUST invoke the real skill through the supported mechanism, respecting its scope and gates. Merely mentioning the skill is not invocation. When no Skill tool exists, read its actual SKILL.md and follow the supported workflow; report any unavailable required capability. A required immediate skill trigger runs first. Read-only Agency triage may run alongside independent skill preparation, but must finish before choosing the substantive implementation approach. Purely conversational skill use follows the simple-reply exception above.

## Routing examples

Each substantive row begins with all-nine assessment; the continuing roles below describe likely follow-through, refined by actual findings.

| User request | Continuing work and next step |
|---|---|
| “Create this feature” | Senior Project Manager defines the outcome; Senior Developer investigates feasibility; UX Architect/UI Designer shape affected flows; reuse the governing plan and approval gates with an explicit ICM stage contract. Application Security Engineer, Payments & Billing Engineer and Accessibility Auditor continue where affected. Code Reviewer/Test Automation Engineer review and verify completed work. |
| “Recreate this feature from this site” | Inspect the accessible reference and clearly label observed behavior versus assumptions. UX Architect/UI Designer describe the flow and visual fit; Senior Developer checks existing components and feasibility. Preserve source/license constraints; explain inaccessible behavior and request only material missing evidence. Do not bypass access controls or pretend inspection occurred. |
| “Ingest these components” | Follow [the pinned ingestion SOP](../ops/phase-e-pinned/INGESTION_SOP.md) and the existing ledger. Senior Developer handles the permitted artifact work; UI Designer/UX Architect/Accessibility Auditor assess previews and interactions; Application Security Engineer reviews trust/dependency boundaries; Code Reviewer/Test Automation Engineer verify evidence. Payments & Billing Engineer continues only if entitlements/billing are affected. Respect owner batch authorization and authenticated operator/reviewer provenance. |
| “Run this skill” | Invoke the requested real skill; retain its owner, scope and restrictions. All-nine triage assesses substantive project work; then assign only relevant contributions. Do not turn a read-only skill into implementation or an unrelated audit. |
| “Fix this bug” | Senior Developer gathers evidence, establishes the cause and makes only the authorized fix within a bounded ICM task; relevant domain specialists assess risk; Code Reviewer and Test Automation Engineer check the result. Preserve the governing plan's scope and required gates. |
| “Change checkout or subscriptions” | Payments & Billing Engineer and Application Security Engineer assess ownership, entitlements and trust boundaries before implementation. Senior Developer implements within the approved phase; UX Architect/UI Designer/Accessibility Auditor cover affected customer interactions; Code Reviewer/Test Automation Engineer check fixtures and regressions. No live charge, refund, checkout or provider mutation is implied. |
| “Explain or audit this” | All assessments and specialist follow-through remain read-only. Assign non-trivial investigation to the relevant specialists with explicit read-only inputs and outputs; return evidence, uncertainty and proposed next actions without remediation. |
| An unfamiliar substantive request | Senior Project Manager frames the intended outcome; all nine assess applicability. Codex selects the closest existing workflow, investigates authorized unknowns and asks only about material ambiguity. Do not invent a capability or install new agents to fill a gap. |

For ingestion, the SOP is the operational authority: at most **10 creators per batch**, immutable pinned source closure, source/dependency/asset licensing evidence, exact packet hashes, readiness checks, verified deployed bytes, the authorized emitter transaction and readback/ledger reconciliation. Preserve authenticated review/operator provenance and owner authorization; never fabricate reviewer identities or visual inspection. Do not substitute handwritten SQL, privileged-role shortcuts or partial transactions. Reuse the SOP's existing eligibility and standing authorization rules rather than inventing new approval gates. Hold concrete unresolved conflicts and report exact published/held counts.

## Keep the product owner informed

Use plain language, exact names and the reason each agent is involved. Translate jargon only when it helps a decision. Announce queued work before it starts and running work only after the tool confirms it; batch related updates to avoid nine repetitive messages. The user should always understand the current outcome, what is happening next and whether a decision is needed.

Example before dispatch: “I’ll have all nine agents assess this request, then keep the relevant specialists involved. Senior Project Manager and Senior Developer are queued first to clarify the outcome and feasibility.”

Example after successful invocations: “UX Architect is reviewing how customers will use this feature. UI Designer is checking how it fits the existing screens. Next, Senior Developer will assess the implementation.”

Report meaningful findings, decisions and blockers during work. Finish with the delivered result, participating agents and contributions, actual verification outcomes, remaining gaps and the next action. Include the real assessment count, such as “9/9 assessed” or “8/9 assessed; Accessibility Auditor blocked.” Do not label all work complete merely because triage completed.

## Authorization and failure handling

Continue routine authorized work yourself as coordinator; the user does not choose internal agents. Preserve explicit read-only, plan-only and stop requests. A user stop cancels pending assignments and interrupts active work where supported. Make required approvals concrete and explain why they are needed; do not ask again when the session already grants the relevant authorization.

Preserve existing profiles, instructions, unrelated uncommitted work, ChatGPT sign-in, saved models, permissions and MCP connections. Do not read or expose credentials. New paid services, destructive actions, production database changes and deployments require the appropriate explicit authorization. Follow the documented VPS/SSH deployment workflow; never use Vercel for HigherBits. Installing this playbook or running its smoke tests authorizes no product remediation, live billing action or production operation.

If a named agent is unavailable or fails, record its name, error and affected deliverable; do not relabel a different agent as that Agency agent. Check the supported discovery/runtime mechanism without modifying saved settings. Retry once only when there is concrete reason to expect recovery. Explain any proposed substitute and keep the original role visibly unfulfilled. Continue independent authorized work, but block dependent decisions or completion claims until the missing review is resolved or the user explicitly changes the scope. If a fresh session is needed for profile discovery, checkpoint the task and give that exact next action. Never claim 9/9 success with a failed or substituted role.

Unavailable-agent example: “Accessibility Auditor could not start. The other eight assessments are complete. I can continue the independent source review, but accessibility sign-off remains blocked. Next I’ll check profile discovery; I won’t count another role as that auditor.”

## Verification and limits

Installation evidence belongs in `docs/agency-playbook-setup-2026-10-14/`; [AI_TEAM.md](AI_TEAM.md) records the current verification status. Keep static checks, live named-agent smoke tests and product tests separate. This document defines behavior; it is not an enforcement hook or a guarantee against runtime failures.

Static checks must confirm both discovery links, exact nine-name/profile correspondence, the routing examples, no recursive triage, unavailable-role accounting and preserved unrelated instructions/settings/profiles/work. Exercise read-only, plan-only, stop, explicit-skill, progress-update, scope-change and concurrency cases without enacting product changes. Label unavailable-agent scenarios as simulated unless a real failure occurred.

Live smoke tests must invoke all nine actual named profiles in the signed-in Codex service, ask each for a bounded playbook assessment/scenario response, and retain invocation IDs, terminal results and role-specific findings. Supply the installed playbook and role constraints to each child, forbid nested delegation and writes, and distinguish successful loading from compliance with the requested behavior. Use `--sandbox read-only` for CLI tests; the previously approved temporary `--model gpt-6-astra` override may be used without changing saved settings. Do not use an API-key/provider fallback.

Smoke success establishes profile loading and bounded routing behavior for the exercised cases. It does not prove product correctness, accessibility conformance, security, payment behavior or guaranteed routing in every future request. Record any unchecked cases and residual limits honestly. Preserve prior dated installation evidence; earlier profile-loading tests alone do not verify this playbook.
