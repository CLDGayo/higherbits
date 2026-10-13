**PASS — executable-plan adequacy.** The authoritative affected-recheck resolutions address all bounded concerns:

- **Config paths:** Explicit absolute `testDir` and `globalSetup` resolve from the web root, correcting inheritance of shared `./e2e` paths into a config located inside `apps/web/e2e/`.
- **Evidence dimensions:** Admin viewport is explicitly 1280×720 for four protected Axe records and matched light/dark comparisons. Eight separate visual captures retain 1280×900 desktop coverage and cannot substitute for matched 720-height proof.
- **Evidence preamble:** Fresh entry evidence is accurately limited to the original runner’s 117 files/928 passing tests. It lacks a simultaneous source manifest and proves no new behavior. The new scoped runner still requires its own focused/full pre-source baseline and post-change comparison.
- **Completion semantics:** Duplicate/reordered steps survive migration, synchronization, URL/OS and IDE updates. Actual completion separately retains `completeStep`’s existing `[...new Set([...prev.completedSteps, step])]` behavior, with both boundaries required in the actual onboarding suite.

No remaining concern within this reconciliation. Implementation, runtime evidence and independent EVL remain pending; this PASS does not prove those future gates.

Four tool calls; no mutations or tests performed.
