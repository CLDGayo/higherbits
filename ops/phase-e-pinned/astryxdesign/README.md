# Astryxdesign Pinned Audit Packet

This packet records the audit and hold decisions for `Astryxdesign` (Row 19 in the 21st creators ledger).

## Summary
- **Total Ledger Items**: 10
- **Qualified Items**: 0
- **Held Items**: 10
- **Candidate Repository**: `https://github.com/facebook/astryx` at commit `4607f2fbcbce09e28ba0aee4047b898c9ff12ea7`
- **Candidate Repository Owner**: `facebook` (Meta Platforms, Inc. / Meta Open Source)
- **Primary Hold Reasons**:
  1. `ownership_mismatch_unverified`: Unverified correlation between Meta Platforms, Inc. and 21st user `Astryxdesign`.
  2. `path_non_existent`: Paths without `packages/core/src/` prefix do not exist at root.
  3. `unverified_standalone_closure`: Heavy dependency on Meta StyleX compiler and internal `@astryxdesign/core` package ecosystem.

See [AUDIT_REPORT.md](AUDIT_REPORT.md) and [manifest.json](manifest.json) for full details.
