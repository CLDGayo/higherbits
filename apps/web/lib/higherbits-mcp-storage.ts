import type { OnboardingState } from "@/app/higherbits-mcp/onboarding/page.client"

const keys = ["magic_onboarding_state", "higherbits_mcp_onboarding_state"] as const
const steps = ["welcome", "select-ide", "install-ide", "create-component", "upgrade-pro", "troubleshooting"]

function isOnboardingState(value: unknown): value is OnboardingState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const state = value as Record<string, unknown>
  return typeof state.currentStep === "string" && steps.includes(state.currentStep)
    && (state.selectedIde === null || ["cursor", "cline", "windsurf"].includes(state.selectedIde as string))
    && ["mac", "windows", "linux"].includes(state.osType as string)
    && Array.isArray(state.completedSteps)
    && state.completedSteps.every((step) => typeof step === "string" && steps.includes(step))
}

export function readOnboardingState(): OnboardingState | null {
  const candidates = keys.map((key) => {
    try {
      const serialized = localStorage.getItem(key)
      const value: unknown = serialized === null ? null : JSON.parse(serialized)
      return isOnboardingState(value) ? value : null
    } catch {
      return null
    }
  })
  return candidates[0] || candidates[1] || null
}

function verifyAliases(expected: string | null): boolean {
  const results = keys.map((key) => {
    try {
      return localStorage.getItem(key) === expected
    } catch {
      return false
    }
  })
  return results.every(Boolean)
}

export function writeOnboardingState(state: OnboardingState): boolean {
  let serialized: string
  try {
    if (!isOnboardingState(state)) return false
    serialized = JSON.stringify(state)
  } catch {
    return false
  }
  const results = keys.map((key) => {
    try {
      localStorage.setItem(key, serialized)
      return true
    } catch {
      return false
    }
  })
  const verified = verifyAliases(serialized)
  return results.every(Boolean) && verified
}

export function clearOnboardingState(): boolean {
  keys.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch {}
  })
  return verifyAliases(null)
}
