/**
 * Prisma error predicates.
 *
 * Separate from the server modules that use them so they can be unit-tested
 * without importing Prisma - lib/prisma.ts constructs a PrismaClient at import
 * time, which needs DATABASE_URL and has no place in a unit test.
 */

/**
 * A unique constraint violation. Postgres raises 23505; Prisma surfaces it as
 * P2002.
 *
 * Duck-typed rather than `instanceof PrismaClientKnownRequestError` so this
 * file stays dependency-free, and so it still works on an error that crossed a
 * server-action boundary and lost its prototype.
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  )
}
