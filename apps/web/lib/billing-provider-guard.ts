/**
 * Billing provider mutual-exclusion guard (Phase 05 — supabase-interconnect).
 *
 * `users_to_plans` has no `provider` column. Provider identity is derived from
 * two EXISTING signals:
 *   - Stripe          -> `meta.stripe_customer_id` / `meta.stripe_subscription_id`
 *                        (embedded in the `meta` JSON blob)
 *   - Lemon Squeezy   -> the top-level `lemon_squeezy_subscription_id` column
 *
 * Two rules this module exists to enforce:
 *
 *  1. A webhook from provider X must NEVER overwrite a row that is ACTIVELY
 *     owned by provider Y. It skips the write and logs instead.
 *
 *  2. It must NEVER block a legitimate write. Specifically: a same-provider
 *     renewal, a switch onto a non-active (canceled/inactive) row, a row with
 *     no markers, and a row with BOTH markers (legacy residue) are all ALLOWED.
 *     Wrongly blocking a renewal silently cuts off a paying customer, which is
 *     worse than the conflict this guard prevents — so every ambiguous case
 *     resolves to "allow".
 *
 *  3. Any write that establishes a new owner must also NULL the losing
 *     provider's marker in the SAME write (`clearingPatchFor`), so the two
 *     markers stay mutually exclusive by construction rather than by runtime
 *     tie-breaking.
 *
 * Note on `status`: the only literals written anywhere in the three webhook
 * routes are `"active"` and `"inactive"`. "Active" therefore means exactly
 * `status === "active"`; anything else counts as not-actively-owned.
 */

export type BillingProvider = "stripe" | "lemonsqueezy"

/** Derived ownership of an existing `users_to_plans` row. */
export type DerivedProvider = BillingProvider | "none" | "ambiguous"

/** The subset of a `users_to_plans` row this guard reads. */
export interface UsersToPlansRowLike {
  status?: string | null
  meta?: unknown
  lemon_squeezy_subscription_id?: string | null
}

const ACTIVE_STATUS = "active"

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

/** True when `meta` carries a Stripe identity marker. */
export function hasStripeMarker(row: UsersToPlansRowLike | null | undefined): boolean {
  const meta = row?.meta
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return false
  const m = meta as Record<string, unknown>
  return isNonEmptyString(m.stripe_customer_id) || isNonEmptyString(m.stripe_subscription_id)
}

/** True when the top-level Lemon Squeezy subscription column is populated. */
export function hasLemonSqueezyMarker(
  row: UsersToPlansRowLike | null | undefined,
): boolean {
  return isNonEmptyString(row?.lemon_squeezy_subscription_id)
}

/**
 * Derive which provider currently owns a row.
 * `"ambiguous"` = both markers present (a legacy row written before the
 * mutual-clearing fix). Treated as allow-and-repair, never as a conflict.
 */
export function deriveBillingProvider(
  row: UsersToPlansRowLike | null | undefined,
): DerivedProvider {
  if (!row) return "none"
  const stripe = hasStripeMarker(row)
  const lemon = hasLemonSqueezyMarker(row)
  if (stripe && lemon) return "ambiguous"
  if (stripe) return "stripe"
  if (lemon) return "lemonsqueezy"
  return "none"
}

/**
 * Client-side variant. The billing page receives a FLATTENED plan object
 * (`stripe_subscription_id` lifted out of `meta`), not the raw row — so it
 * cannot use `deriveBillingProvider`. Same precedence, same "both markers =
 * ambiguous" rule.
 */
export function deriveProviderFromPlanInfo(
  info:
    | {
        stripe_subscription_id?: string | null
        lemon_squeezy_subscription_id?: string | null
      }
    | null
    | undefined,
): DerivedProvider {
  if (!info) return "none"
  const stripe = isNonEmptyString(info.stripe_subscription_id)
  const lemon = isNonEmptyString(info.lemon_squeezy_subscription_id)
  if (stripe && lemon) return "ambiguous"
  if (stripe) return "stripe"
  if (lemon) return "lemonsqueezy"
  return "none"
}

/**
 * Cancel endpoint for a derived provider. `null` means "do not call anything"
 * — the UI must surface a no-active-subscription state instead of silently
 * falling through to Stripe, which is the bug Phase 05 exists to fix.
 *
 * `ambiguous` (both markers, legacy residue) routes to Stripe: the older
 * provider is the likelier live owner, and both cancel routes re-verify
 * ownership server-side and 404 rather than acting on the wrong subscription.
 */
export function cancelEndpointFor(provider: DerivedProvider): string | null {
  if (provider === "none") return null
  if (provider === "lemonsqueezy") return "/api/lemonsqueezy/cancel"
  return "/api/stripe/cancel-subscription"
}

/** A row is actively owned only when its status is exactly "active". */
export function isActiveRow(row: UsersToPlansRowLike | null | undefined): boolean {
  return row?.status === ACTIVE_STATUS
}

export interface GuardDecision {
  /** When true, the caller MUST skip the write (and any downstream sync). */
  skip: boolean
  reason: string
  existingProvider: DerivedProvider
}

/**
 * Decide whether `incomingProvider` may write to `existingRow`.
 *
 * Blocks ONLY the one dangerous case: an active row owned by the other
 * provider. Everything else is allowed.
 */
export function evaluateBillingWrite(
  existingRow: UsersToPlansRowLike | null | undefined,
  incomingProvider: BillingProvider,
): GuardDecision {
  const existingProvider = deriveBillingProvider(existingRow)

  if (!existingRow) {
    return { skip: false, reason: "no existing row — insert", existingProvider }
  }
  if (existingProvider === "none") {
    return { skip: false, reason: "existing row has no provider marker", existingProvider }
  }
  if (existingProvider === "ambiguous") {
    return {
      skip: false,
      reason:
        "existing row carries BOTH provider markers (legacy residue) — allowing write so the losing marker is cleared",
      existingProvider,
    }
  }
  if (existingProvider === incomingProvider) {
    return { skip: false, reason: "same-provider write (renewal/update)", existingProvider }
  }
  if (!isActiveRow(existingRow)) {
    return {
      skip: false,
      reason: `existing ${existingProvider} row is not active (status=${String(existingRow.status)}) — legitimate provider switch`,
      existingProvider,
    }
  }
  return {
    skip: true,
    reason: `cross-provider conflict: row is actively owned by ${existingProvider}, incoming event is ${incomingProvider}`,
    existingProvider,
  }
}

/**
 * Same as `evaluateBillingWrite`, but logs the skip. Callers should `return`
 * immediately when this yields `skip: true` — including before any Clerk
 * `publicMetadata` sync, or Clerk desynchronizes from the DB row.
 */
export function guardBillingWrite(
  existingRow: UsersToPlansRowLike | null | undefined,
  incomingProvider: BillingProvider,
  context: { userId?: string; source: string },
): GuardDecision {
  const decision = evaluateBillingWrite(existingRow, incomingProvider)
  if (decision.skip) {
    console.warn(
      `[billing-provider-guard] SKIPPED write from ${context.source} for user ${context.userId ?? "unknown"}: ${decision.reason}`,
    )
  } else if (decision.existingProvider === "ambiguous") {
    console.warn(
      `[billing-provider-guard] ambiguous row for user ${context.userId ?? "unknown"} (${context.source}): ${decision.reason}`,
    )
  }
  return decision
}

/**
 * The patch fragment that nulls the LOSING provider's marker. Merge this into
 * the same update/insert that establishes `incomingProvider` as the owner.
 */
export function clearingPatchFor(
  incomingProvider: BillingProvider,
): { lemon_squeezy_subscription_id: null } | { meta: null } {
  return incomingProvider === "stripe"
    ? { lemon_squeezy_subscription_id: null }
    : { meta: null }
}
