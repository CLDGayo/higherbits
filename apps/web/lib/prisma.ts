import { PrismaClient } from "@/prisma/client"

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
