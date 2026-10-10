import { afterEach, expect, it, vi } from "vitest"

const { prismaClient } = vi.hoisted(() => ({ prismaClient: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/prisma/client", () => ({ PrismaClient: prismaClient }))

import { getAutoIndexReviewerDatabase } from "@/lib/auto-index/reviewer-database"

const globalForTest = globalThis as typeof globalThis & { autoIndexReviewerPrisma?: unknown }
const originalUrl = process.env.AUTO_INDEX_REVIEWER_DATABASE_URL

afterEach(() => {
  vi.clearAllMocks()
  delete globalForTest.autoIndexReviewerPrisma
  if (originalUrl === undefined) delete process.env.AUTO_INDEX_REVIEWER_DATABASE_URL
  else process.env.AUTO_INDEX_REVIEWER_DATABASE_URL = originalUrl
})

it("fails closed when the reviewer-only database URL is missing", () => {
  delete process.env.AUTO_INDEX_REVIEWER_DATABASE_URL

  expect(() => getAutoIndexReviewerDatabase()).toThrow("auto_index_reviewer_database_unavailable")
  expect(prismaClient).not.toHaveBeenCalled()
})

it("uses only the explicit reviewer URL and never substitutes another database credential", () => {
  const reviewerUrl = "postgresql://reviewer:secret-placeholder@db.example.test:5432/app"
  process.env.AUTO_INDEX_REVIEWER_DATABASE_URL = reviewerUrl

  const client = getAutoIndexReviewerDatabase()

  expect(prismaClient).toHaveBeenCalledWith({ datasourceUrl: reviewerUrl })
  expect(client).toBe(prismaClient.mock.instances[0])
})

it("rejects non-PostgreSQL reviewer URLs without constructing a client", () => {
  process.env.AUTO_INDEX_REVIEWER_DATABASE_URL = "https://example.test"

  expect(() => getAutoIndexReviewerDatabase()).toThrow("auto_index_reviewer_database_unavailable")
  expect(prismaClient).not.toHaveBeenCalled()
})
