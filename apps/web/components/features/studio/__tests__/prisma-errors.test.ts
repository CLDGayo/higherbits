import { describe, expect, it } from "vitest"

import { isUniqueConstraintError } from "@/lib/utils/prisma-errors"

/**
 * This predicate is what turns a duplicate library slug into a field-level
 * "that slug is already taken" instead of an unhandled 500. `collections.slug`
 * is unique globally, so it fires whenever any other account holds the slug.
 */
describe("isUniqueConstraintError", () => {
  it("detects Prisma's unique constraint code", () => {
    expect(isUniqueConstraintError({ code: "P2002" })).toBe(true)
  })

  it("detects it on a real Error carrying the code", () => {
    const error = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
    })
    expect(isUniqueConstraintError(error)).toBe(true)
  })

  it("ignores other Prisma codes", () => {
    expect(isUniqueConstraintError({ code: "P2025" })).toBe(false)
    expect(isUniqueConstraintError({ code: "P1001" })).toBe(false)
  })

  it("does not match the raw Postgres code", () => {
    // Prisma translates 23505 to P2002. If a future path surfaces the raw code
    // instead, this must fail rather than quietly pass.
    expect(isUniqueConstraintError({ code: "23505" })).toBe(false)
  })

  it("survives anything that is not a Prisma error", () => {
    expect(isUniqueConstraintError(null)).toBe(false)
    expect(isUniqueConstraintError(undefined)).toBe(false)
    expect(isUniqueConstraintError(new Error("boom"))).toBe(false)
    expect(isUniqueConstraintError("P2002")).toBe(false)
    expect(isUniqueConstraintError({})).toBe(false)
  })
})
