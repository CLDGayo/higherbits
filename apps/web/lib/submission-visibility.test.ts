import { describe, expect, it } from "vitest"
import { isPublicStatus, visibilityWriteFor } from "./submission-visibility"

describe("visibilityWriteFor", () => {
  it("leaves is_public alone when the status does not change", () => {
    // The 2026-08-13 regression: a featured -> featured patch (editing
    // moderator feedback) republished a component the owner had set private.
    expect(visibilityWriteFor("featured", "featured")).toBeNull()
    expect(visibilityWriteFor("posted", "posted")).toBeNull()
  })

  it("leaves is_public alone when moving between two published statuses", () => {
    expect(visibilityWriteFor("posted", "featured")).toBeNull()
    expect(visibilityWriteFor("featured", "posted")).toBeNull()
  })

  it("ensures is_public is false when transitioning into rejected or on_review", () => {
    expect(visibilityWriteFor("on_review", "rejected")).toBe(false)
    expect(visibilityWriteFor("rejected", "on_review")).toBe(false)
    expect(visibilityWriteFor(undefined, "on_review")).toBe(false)
    expect(visibilityWriteFor(null, "rejected")).toBe(false)
    expect(visibilityWriteFor("rejected", "rejected")).toBe(false)
    expect(visibilityWriteFor("on_review", "on_review")).toBe(false)
  })

  it("publishes on a transition into a published status by default or when targetVisibility is true", () => {
    expect(visibilityWriteFor("on_review", "posted")).toBe(true)
    expect(visibilityWriteFor("rejected", "featured")).toBe(true)
    expect(visibilityWriteFor(null, "featured")).toBe(true)
    expect(visibilityWriteFor("on_review", "posted", true)).toBe(true)
  })

  it("keeps is_public false on approval when user specified targetVisibility as false", () => {
    expect(visibilityWriteFor("on_review", "posted", false)).toBe(false)
    expect(visibilityWriteFor("rejected", "featured", false)).toBe(false)
    expect(visibilityWriteFor(null, "posted", false)).toBe(false)
  })

  it("unpublishes on a transition out of a published status", () => {
    // Demotion is a moderation decision, not a side effect: a rejected
    // component must not stay publicly visible.
    expect(visibilityWriteFor("featured", "rejected")).toBe(false)
    expect(visibilityWriteFor("posted", "on_review")).toBe(false)
  })

  it("classifies statuses", () => {
    expect(isPublicStatus("posted")).toBe(true)
    expect(isPublicStatus("featured")).toBe(true)
    expect(isPublicStatus("on_review")).toBe(false)
    expect(isPublicStatus("rejected")).toBe(false)
    expect(isPublicStatus(null)).toBe(false)
  })
})
