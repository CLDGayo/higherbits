import { describe, expect, it } from "vitest"

import {
  deriveSlug,
  isValidSlug,
  libraryIdentifier,
  libraryInstallCommand,
  libraryNamespace,
} from "@/lib/utils/library-identity"

describe("deriveSlug", () => {
  it("lowercases and hyphenates", () => {
    expect(deriveSlug("Marketing Blocks")).toBe("marketing-blocks")
  })

  it("is idempotent - the create dialog re-derives on every keystroke", () => {
    const once = deriveSlug("Marketing Blocks")
    expect(deriveSlug(once)).toBe(once)
  })

  it("collapses runs of separators rather than emitting empty segments", () => {
    expect(deriveSlug("Hero   ///   Sections")).toBe("hero-sections")
    expect(deriveSlug("a__b--c")).toBe("a-b-c")
  })

  it("trims leading and trailing separators", () => {
    expect(deriveSlug("  !Buttons!  ")).toBe("buttons")
    expect(deriveSlug("---x---")).toBe("x")
  })

  it("folds accents to ASCII instead of dropping the letter", () => {
    // NFKD splits é into e + combining acute; the non-alphanumeric pass then
    // removes the mark, so "cafe" survives rather than becoming "caf".
    expect(deriveSlug("Café")).toBe("cafe")
    expect(deriveSlug("Über Grid")).toBe("uber-grid")
  })

  it("returns an empty string when nothing survives", () => {
    expect(deriveSlug("")).toBe("")
    expect(deriveSlug("!!!")).toBe("")
    expect(deriveSlug("日本語")).toBe("")
  })

  it("always produces something isValidSlug accepts, or nothing at all", () => {
    for (const name of [
      "Marketing Blocks",
      "  !Buttons!  ",
      "Café",
      "a__b--c",
      "Hero   ///   Sections",
    ]) {
      const slug = deriveSlug(name)
      expect(isValidSlug(slug), `${name} -> ${slug}`).toBe(true)
    }
  })
})

describe("isValidSlug", () => {
  it("accepts lowercase alphanumeric with single hyphens", () => {
    expect(isValidSlug("marketing-blocks")).toBe(true)
    expect(isValidSlug("x")).toBe(true)
    expect(isValidSlug("a1-b2-c3")).toBe(true)
  })

  it("rejects what a URL path segment or the DB would not want", () => {
    expect(isValidSlug("")).toBe(false)
    expect(isValidSlug("Marketing")).toBe(false) // uppercase
    expect(isValidSlug("-leading")).toBe(false)
    expect(isValidSlug("trailing-")).toBe(false)
    expect(isValidSlug("double--hyphen")).toBe(false)
    expect(isValidSlug("has space")).toBe(false)
    expect(isValidSlug("has/slash")).toBe(false)
    expect(isValidSlug("a".repeat(101))).toBe(false)
  })
})

describe("libraryNamespace", () => {
  it("prefers display_username, the handle the rest of the app shows", () => {
    expect(
      libraryNamespace({ username: "raw", display_username: "Shown" }),
    ).toBe("Shown")
  })

  it("falls back to username", () => {
    expect(libraryNamespace({ username: "raw", display_username: null })).toBe(
      "raw",
    )
  })

  it("returns null when the owner has no handle at all", () => {
    // Both columns are nullable. Callers must render without an identifier
    // rather than printing "@null".
    expect(libraryNamespace({ username: null, display_username: null })).toBe(
      null,
    )
    expect(libraryNamespace({})).toBe(null)
    expect(libraryNamespace(null)).toBe(null)
  })

  it("treats an empty string as no handle", () => {
    expect(libraryNamespace({ username: "", display_username: "" })).toBe(null)
  })
})

describe("libraryIdentifier", () => {
  it("builds @namespace/slug", () => {
    expect(libraryIdentifier("acme", "buttons")).toBe("@acme/buttons")
  })

  it("degrades to the bare slug when there is no namespace", () => {
    expect(libraryIdentifier(null, "buttons")).toBe("buttons")
  })
})

describe("libraryInstallCommand", () => {
  it("matches the component CLI convention already in the app", () => {
    // intercepted-demo-modal.tsx:147 uses `npx higherbits add {slug}`.
    expect(libraryInstallCommand("@acme/buttons")).toBe(
      "npx higherbits add @acme/buttons",
    )
  })

  it("composes with a namespace-less identifier", () => {
    expect(libraryInstallCommand(libraryIdentifier(null, "buttons"))).toBe(
      "npx higherbits add buttons",
    )
  })
})
