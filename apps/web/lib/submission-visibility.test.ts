import { describe, expect, it } from "vitest"
import { isPublicStatus, visibilityWriteFor } from "./submission-visibility"

describe("visibilityWriteFor", () => {
  it("leaves is_public alone when the status does not change", () => {
    // The 2026-08-13 regression: a featured -> featured patch (editing
    // moderator feedback) republished a component the owner had set private.
    expect(visibilityWriteFor("featured", "featured")).toBeNull()
    expect(visibilityWriteFor("posted", "posted")).toBeNull()
    expect(visibilityWriteFor("on_review", "on_review")).toBeNull()
    expect(visibilityWriteFor("rejected", "rejected")).toBeNull()
  })

  it("leaves is_public alone when moving between two published statuses", () => {
    expect(visibilityWriteFor("posted", "featured")).toBeNull()
    expect(visibilityWriteFor("featured", "posted")).toBeNull()
  })

  it("leaves is_public alone when moving between two unpublished statuses", () => {
    expect(visibilityWriteFor("on_review", "rejected")).toBeNull()
    expect(visibilityWriteFor("rejected", "on_review")).toBeNull()
  })

  it("publishes on a transition into a published status", () => {
    expect(visibilityWriteFor("on_review", "posted")).toBe(true)
    expect(visibilityWriteFor("rejected", "featured")).toBe(true)
    expect(visibilityWriteFor(null, "featured")).toBe(true)
  })

  it("unpublishes on a transition out of a published status", () => {
    // Demotion is a moderation decision, not a side effect: a rejected
    // component must not stay publicly visible.
    expect(visibilityWriteFor("featured", "rejected")).toBe(false)
    expect(visibilityWriteFor("posted", "on_review")).toBe(false)
  })

  it("treats a missing prior submission as unpublished", () => {
    expect(visibilityWriteFor(undefined, "on_review")).toBeNull()
    expect(visibilityWriteFor(null, "rejected")).toBeNull()
  })

  it("classifies statuses", () => {
    expect(isPublicStatus("posted")).toBe(true)
    expect(isPublicStatus("featured")).toBe(true)
    expect(isPublicStatus("on_review")).toBe(false)
    expect(isPublicStatus("rejected")).toBe(false)
    expect(isPublicStatus(null)).toBe(false)
  })
})
