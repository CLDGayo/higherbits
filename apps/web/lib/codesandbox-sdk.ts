import { CodeSandbox } from "@codesandbox/sdk"

export const codesandboxSdk = new CodeSandbox(process.env.CSB_API_KEY!)

export const DEFAULT_TEMPLATE = "21st-vite"

export const TEMPLATES = {
  "21st-vite": "d5t2cg",
}

// Keep the VM warm longer between edits so refreshes don't repeatedly land on a
// waking VM (which serves a blank preview until its dev server recompiles).
// Trade-off: a warmer VM burns more VM credits. 300s matches CSB's free default.
export const DEFAULT_HIBERNATION_TIMEOUT = 300
