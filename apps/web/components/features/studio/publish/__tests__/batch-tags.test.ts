import { describe, expect, it } from "vitest"
import { parseBatchTags } from "../utils/batch-tags"

describe("parseBatchTags", () => {
  it("parses user specified comma-separated tag string correctly", () => {
    const input =
      "Authentication, Login, Sign In, Split Screen, Glassmorphism, Form, Social Proof, Dual Theme, React, Tailwind CSS"
    const parsed = parseBatchTags(input)

    expect(parsed).toEqual([
      "Authentication",
      "Login",
      "Sign In",
      "Split Screen",
      "Glassmorphism",
      "Form",
      "Social Proof",
      "Dual Theme",
      "React",
      "Tailwind CSS",
    ])
  })

  it("handles whitespace, trailing commas, and duplicate values", () => {
    const input =
      "  React , Tailwind CSS, react, , NEXT.JS, Next.js ,   Tailwind CSS  , "
    const parsed = parseBatchTags(input)

    expect(parsed).toEqual(["React", "Tailwind CSS", "NEXT.JS"])
  })

  it("returns empty array on empty or invalid inputs", () => {
    expect(parseBatchTags("")).toEqual([])
    expect(parseBatchTags("   , , , ")).toEqual([])
    expect(parseBatchTags(null as any)).toEqual([])
    expect(parseBatchTags(undefined as any)).toEqual([])
  })
})
