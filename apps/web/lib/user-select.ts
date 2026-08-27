/**
 * Public-safe column list for any EMBEDDED author/user row.
 *
 * WHY THIS EXISTS
 * ---------------
 * `users!<fk>(*)` selects every column on `users`, which includes `email`,
 * `paypal_email`, `stripe_id`, `is_admin`, `role`, `bundles_fee` and `ref`.
 * Those embeds hang author rows off `demos`/`components` results, which are
 * passed as props into `"use client"` components — so React serialises them
 * into the RSC flight payload, and the payload ships inside the HTML of a
 * page any anonymous visitor can `curl`.
 *
 * Measured before this constant existed: `/{username}` served a real user's
 * `email`, `paypal_email`, `stripe_id` and `is_admin` to logged-out visitors,
 * and the landing page's catalogue rows staged 112 such records on `/`.
 *
 * SCOPE — embeds only
 * -------------------
 * Use this for the AUTHOR of a component/demo, i.e. somebody else's row being
 * shown to a viewer. Do NOT use it for a standalone `.from("users")` lookup of
 * the REQUESTING user's own row (Stripe/Lemon Squeezy checkout, the studio
 * header, `checkIsAdmin`) — those legitimately need `email`/`is_admin` and are
 * scoped to the caller's own account.
 *
 * WHY A LITERAL, NOT AN ARRAY `.join()`
 * --------------------------------------
 * supabase-js parses the select string at the TYPE level to infer the row
 * shape. An interpolated value of type `string` (what `[...].join(", ")`
 * returns) makes the field list unresolvable and every consuming query
 * degrades to `ParserError<...>`, taking ~40 downstream type errors with it.
 * Keep this a single `as const` string literal.
 *
 * ADDING A COLUMN
 * ---------------
 * Only add a column that is safe for an anonymous stranger to read. If a
 * feature needs a private column, give it its own query scoped to the owner
 * rather than widening this list — and never restore `(*)`.
 */
export const PUBLIC_USER_COLUMNS =
  "id, username, display_username, name, display_name, image_url, display_image_url, bio, manually_added, created_at, website_url, twitter_url, github_url, pro_referral_url" as const

/**
 * The row shape `PUBLIC_USER_COLUMNS` actually returns.
 *
 * Annotate anything that surfaces another person's profile with this instead of
 * `User` (the full table row). If a consumer fails to compile against it, that
 * consumer is reading a private column and needs its own owner-scoped query —
 * the compile error is the point, not an obstacle.
 */
export type PublicUser = Pick<
  import("@/types/global").User,
  | "id"
  | "username"
  | "display_username"
  | "name"
  | "display_name"
  | "image_url"
  | "display_image_url"
  | "bio"
  | "manually_added"
  | "created_at"
  | "website_url"
  | "twitter_url"
  | "github_url"
  | "pro_referral_url"
>
