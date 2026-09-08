# HigherBits.dev — Project Analysis Report (2026-08-03)

This report documents the architectural, behavioral, and operational topology of the `HigherBits.dev` project as of August 2026, discovered via graphify and direct inspection.

## 1. Codebase Architecture & Tech Stack

The project is structured as a **Turborepo** monorepo (`apps/web`, `packages/db`, `packages/ui`, etc.) running a modern, high-performance stack:
- **Core Framework**: Next.js (app router) with React & TypeScript.
- **State Management**: Jotai.
- **Styling**: Tailwind CSS combined with Radix UI primitives.
- **Authentication**: Clerk.
- **Database & Backend**: Supabase (with `pglite` and `pgvector` for local embeddings) and Prisma ORM.
- **Payments & Billing**: Stripe & Lemon Squeezy integrations.
- **Testing**: Playwright (E2E) and Vitest (Unit).

### God Nodes & Core Abstractions
Based on the `graphify` topological analysis, the core pillars (highest-connectivity abstractions) of the codebase are:
- `useClerkSupabaseClient()` & `supabaseWithAdminAccess`: Primary bridges for authenticated database interactions.
- `cn()` & `Button`: Foundational UI and styling abstractions.
- `PrismaPromise`: Core to database operations.

---

## 2. Agentic Framework & Behaviors (RIPER-5)

The repository is governed by the highly structured **RIPER-5 Spec-Driven Development System**. It enforces strict phase-locking to prevent premature execution.

### The Phases
1. **RESEARCH** (`vc-research-agent`): Read-only context and fact-gathering.
2. **SPEC** (`vc-spec-agent`): Product discovery and requirements doc generation.
3. **INNOVATE** (`vc-innovate-agent`): Solution exploration and decision summaries (chosen vs. rejected approaches).
4. **PLAN** (`vc-plan-agent`): Formal planning with touchpoints, blast radius, and evidence.
5. **VALIDATE** (`vc-validate-agent`): Conversion of the plan into an executable contract.
6. **EXECUTE** (`vc-execute-agent`): Implementation of the approved plan.
7. **UPDATE PROCESS** (`vc-update-process-agent`): Archiving, context updates, and learning capture.

### Key Enforced Behaviors
- **Mandatory Graphify**: Agents *must* query the knowledge graph before taking any action.
- **Autopilot & /goal Mode**: Full autonomy for executing multi-phase programs without human pauses (except for hard stops).
- **PVL/EVL Loops**: Iterate-until-green loops driven by `vc-tester` for verifying code correctness automatically.
- **Strategy Comparison**: At every phase transition, the orchestrator invokes `vc-agent-strategy-compare` to decide between execution modes.
- **Direct-to-main Commits**: Working locally on `main` is standard protocol unless a PR is explicitly requested.

---

## 3. Installed Skills & Capabilities

The vault and sibling repository are equipped with a massive registry of helper and contract skills. 

### Design & Frontend
- `taste-skill`: Enforces anti-slop frontend design (variance, motion, density).
- `soft-skill`: High-end, calm, luxury visual design.
- `minimalist-skill`: Editorial, Notion/Linear aesthetic.
- `vc-frontend-design`: Translates designs/screenshots into polished UI.
- `redesign-skill`: Audit-first UI overhauls.

### Engineering & QA
- `vc-debugger`: Evidence-first root cause analysis.
- `vc-security`: STRIDE + OWASP security audits.
- `vc-scenario`: 12-dimension edge case generation.
- `vc-autoresearch`: Autonomous metric optimization loops (e.g., bundle size, test coverage).
- `vc-predict`: Pre-implementation architectural debate with 5 simulated personas.
- `vc-web-testing`: E2E test automation using Playwright/Vitest.

### Operations & Planning
- `vc-generate-plan`, `vc-generate-context`, `vc-audit-plans`: Tools for keeping plans and routing truth organized and up to date.
- `vibecode-pro-max-kit`: A mandated toolkit run in every prompt.
- `gayo-vps`: Trigger for deploying the app to your VPS.

---

## 4. MCP Servers & Automations

The environment connects to Model Context Protocol (MCP) servers to extend agent capabilities:

- **Chrome DevTools (`chrome-devtools`)**: Allows agents (`vc-agent-browser`) to spin up Puppeteer, take screenshots, run Lighthouse audits, scrape, and visually test the application.
- **GitHub (`github`)**: Read/write access to repositories, PRs, issues, and code search for managing the DevOps lifecycle natively.
- **Headroom (`headroom`)**: Specialized context-optimization proxy for compressing context windows when running deep nested agent loops.
- **Internal Endpoints**: The codebase itself exposes internal MCP endpoints (`magic-mcp` and `search-mcp`) for deep AI integrations.
