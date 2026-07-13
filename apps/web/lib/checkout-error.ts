// Shared helper for gracefully handling the "payments not configured" state.
//
// While the payment provider is being migrated, the checkout-creating API
// routes return HTTP 503 with `{ error: "payments_not_configured" }` instead of
// a raw 500. Client call sites use this helper to show a neutral, informative
// toast (not a red error) so store reviewers never see a broken-site signal.

export const PAYMENTS_UNAVAILABLE_MESSAGE =
  "Checkout temporarily unavailable — email support@higherbits.dev to purchase."

/**
 * Returns true when a failed checkout response signals that payments are not
 * configured yet. The 503 status is the authoritative signal (only the checkout
 * routes emit it for this case); the optional body is checked as a best effort
 * when available (it may be a parsed object or the raw response text).
 */
export function isPaymentsNotConfigured(
  status: number,
  body?: unknown,
): boolean {
  if (status !== 503) return false
  if (typeof body === "string") {
    return body.includes("payments_not_configured")
  }
  if (body && typeof body === "object") {
    return (body as { error?: string }).error === "payments_not_configured"
  }
  return true
}
