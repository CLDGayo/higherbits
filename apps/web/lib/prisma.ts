import { PrismaClient } from "@/prisma/client"
import { existsSync } from "node:fs"
import { join } from "node:path"

// Prisma's Next bundle can resolve its engine relative to a duplicated
// `apps/web` path on the VPS. Point it at the generated Debian engine in the
// app's traced Prisma output; keep explicit deployment overrides intact.
if (
  process.platform === "linux" &&
  process.env.NODE_ENV === "production" &&
  !process.env.PRISMA_QUERY_ENGINE_LIBRARY
) {
  const queryEnginePath = join(
    process.cwd(),
    "prisma/client/libquery_engine-debian-openssl-3.0.x.so.node",
  )
  if (existsSync(queryEnginePath)) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = queryEnginePath
  }
}

/**
 * A single PrismaClient per process, not per module instance.
 *
 * `next dev` compiles routes on demand with webpack, and each route bundle
 * that imports this module can end up constructing its own client. Every
 * client opens its own connection pool, so six studio routes meant six pools
 * against a non-pooled Postgres host - enough to exhaust `max_connections`
 * and fail requests with "remaining connection slots are reserved".
 *
 * Caching on `globalThis` survives module re-evaluation, so dev reuses one
 * client. Production compiles once and is not affected, so it gets a fresh
 * instance with no global handle left behind.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma
