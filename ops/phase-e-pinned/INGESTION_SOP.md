# Auto-Indexed Component Ingestion SOP

Use this workflow for every new 21st.dev auto-indexed creator or component. The 21st Creators sheet is the work ledger, and the existing VGPU capture/emitter is the reference implementation. For creator imports, handle at most 10 creators per batch and checkpoint each batch before starting the next.

## 1. Select and pin the source

- Read the current `auto-index=true` rows and component slugs from the connected 21st Creators sheet. Treat `true` as the user's approved selection and evidence that 21st.dev's MIT-or-equivalent eligibility gate passed; retain the source row/link as provenance instead of re-litigating that gate for every item.
- Map each component to its exact upstream repository, immutable commit, and source path. Do not guess a repository, path, or author mapping. Check whether each component is already live so reruns remain idempotent.
- Record the pinned source's license text/path when available, and inspect direct/transitive dependencies and bundled third-party assets separately. Hold only on concrete contrary evidence (such as a restrictive source license or unverified third-party asset), and record the reason; a missing license file alone does not override the 21st.dev curation signal.
- Save the exact source closure (including local helpers) under `ops/phase-e-pinned/<creator>/source/`, preserving relative paths. Record byte lengths and SHA-256 hashes in the manifest.

## 2. Prepare the complete artifact packet

For each eligible item, prepare the original source, a HigherBits demo wrapper, dependency/license evidence, a standalone preview bundle and PNG, a self-contained GoHighLevel export when required, and all ten saved prompt flavors: `sitebrew`, `v0`, `lovable`, `bolt`, `extended`, `replit`, `magic_patterns`, `claude`, `codex`, and `antigravity`.

Use Antigravity with Gemini 3.8 Flash High for auto-index prompt generation, and Claude Code for source mapping and packet preparation when available. Review their output against the pinned files. Do not publish hotlinked images, fonts, or other remote assets unless rights are verified and their provenance is recorded. Keep previews self-contained, retain required notices, and verify the component is centered, unclipped, and functional at the intended preview size.

## 3. Run readiness checks and capture review evidence

- Run the creator's pinned emitter in `--check` mode (the VGPU reference is `node ops/emit-pinned-vgpu-production.mjs --check`). Resolve every pending item or record a specific hold reason; do not lower a gate to make an item pass.
- Inspect the rendered preview and GHL export, check browser/runtime errors, verify prompt coverage, dependency approval, manifest hashes, and the exact deployed asset URLs and bytes.
- Generate the emitter review record for the exact release commit and packet hashes. It must contain the verified asset URLs, a real reviewer identity, review time, production scope, and a meaningful rationale. Never fabricate reviewer identity or substitute a tool/session label for an authenticated person.

## 4. Stage and publish through the supported trust boundary

The pinned emitter produces a reviewed candidate transaction; it does not publish directly. Apply its output only using the dedicated `auto_index_stage` database login. Do not use `SET ROLE`, `service_role`, direct privileged shortcuts, or an unauthenticated review decision. Candidate qualification is not publication.

Publish through the current authenticated HigherBits admin review flow with a real Clerk admin whose database user is marked admin. Deploy preview assets first, verify them over HTTPS byte-for-byte, then approve and publish the candidates. If authenticated reviewer access or an emitter prerequisite is unavailable, stop at the last verified stage, save the checkpoint, and resume when the required access is available.

## 5. Reconcile and close each batch

After publication, read back the component and creator rows from HigherBits, verify source attribution, license, saved prompts, preview URLs, and publication status, then update the sheet and batch checkpoint with published IDs and held-item reasons. Report the exact published and held counts; never mark a candidate ingested based only on generated SQL, a successful upload request, or a sheet flag.

Keep creator source packets, emitter scripts, and per-batch checkpoints under `ops/phase-e-pinned/`. Reuse the existing emitter and artifact conventions where possible, and update this SOP when the authenticated publishing path or readiness contract changes.
