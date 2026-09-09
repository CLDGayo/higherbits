/**
 * Where paid component source lives in R2.
 *
 * Kept in its own module with no `server-only` marker because the publish flows
 * that write these keys are client components, while the readers are
 * server-only. Both need the same constant, and it must not drift.
 *
 * Only SOURCE goes under this prefix. Preview images, videos, bundled HTML and
 * registry JSON stay publicly readable — they are loaded directly by the
 * browser as <img>/<video>/<iframe> sources, so making them private would break
 * rendering rather than protect anything.
 */
export const SOURCE_PREFIX = "src/"

/** Prefixes a source key. Safe to call twice — it will not double-prefix. */
export const sourceKey = (key: string) =>
  key.startsWith(SOURCE_PREFIX) ? key : `${SOURCE_PREFIX}${key}`
