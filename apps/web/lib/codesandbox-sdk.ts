import { CodeSandbox, VMTier } from "@codesandbox/sdk"
export * from "./sandbox-templates"

export const codesandboxSdk = new CodeSandbox(process.env.CSB_API_KEY || "")

// Pin every VM we create or resume to the smallest tier. Left unpinned, VMs
// start at the account default, which is larger and bills proportionally more.
//
// Overridable by NAME (Pico | Nano | Micro | Small | Medium | Large | XLarge)
// so bumping a tier is a host config change, never a code change — the same
// override shape already used for CSB_HIBERNATION_TIMEOUT. Pico is 1 CPU /
// 2 GiB; if a template will not boot on it, set CSB_VM_TIER=Nano.
export const DEFAULT_VM_TIER = VMTier.fromName(
  (process.env.CSB_VM_TIER ?? "Pico") as Parameters<typeof VMTier.fromName>[0],
)

