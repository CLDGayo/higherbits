import "server-only"

import { PrismaClient } from "@/prisma/client"

const globalForAutoIndexReviewer = globalThis as typeof globalThis & {
  autoIndexReviewerPrisma?: PrismaClient
}

/**
 * Return a Prisma client authenticated only with the dedicated reviewer login.
 * This deliberately does not fall back to DATABASE_URL or Supabase service_role.
 */
export function getAutoIndexReviewerDatabase(): PrismaClient {
  const reviewerUrl = process.env.AUTO_INDEX_REVIEWER_DATABASE_URL
  if (!reviewerUrl) {
    throw new Error("auto_index_reviewer_database_unavailable")
  }

  let parsed: URL
  try {
    parsed = new URL(reviewerUrl)
  } catch {
    throw new Error("auto_index_reviewer_database_unavailable")
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new Error("auto_index_reviewer_database_unavailable")
  }

  if (!globalForAutoIndexReviewer.autoIndexReviewerPrisma) {
    globalForAutoIndexReviewer.autoIndexReviewerPrisma = new PrismaClient({ datasourceUrl: reviewerUrl })
  }
  return globalForAutoIndexReviewer.autoIndexReviewerPrisma
}
