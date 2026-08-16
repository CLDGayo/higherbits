import { beforeEach, describe, expect, it, vi } from "vitest"

const findUnique = vi.fn()
const findFirst = vi.fn()
const update = vi.fn(async (_args: unknown) => ({ ok: true }))
const del = vi.fn(async (_args: unknown) => ({ ok: true }))
const create = vi.fn(async (_args: unknown) => ({ ok: true }))

const deleteR2Prefix = vi.fn(async (_args: unknown) => 0)

vi.mock("server-only", () => ({}))
// `lib/r2` asserts its credentials at module load, so it is mocked rather than
// imported for real. `deleteArtifact` imports it dynamically; vitest resolves
// that through this mock the same way it would a static import.
vi.mock("../../../r2", () => ({
  deleteR2Prefix: (args: unknown) => deleteR2Prefix(args),
}))
vi.mock("../../../prisma", () => ({
  default: {
    studio_artifacts: {
      findUnique: (args: unknown) => findUnique(args),
      findFirst: (args: unknown) => findFirst(args),
      update: (args: unknown) => update(args),
      delete: (args: unknown) => del(args),
      create: (args: unknown) => create(args),
    },
  },
}))

import {
  ArtifactForbiddenError,
  ArtifactNotFoundError,
  ArtifactPayloadError,
  createArtifact,
  deleteArtifact,
  getArtifact,
  setArtifactVisibility,
  updateArtifact,
  validatePayload,
} from "../artifacts"

const ID = "22222222-2222-2222-2222-222222222222"
const OWNER = "user_owner"
const OTHER = "user_other"

const ownedRow = { id: ID, user_id: OWNER, kind: "theme" }

describe("validatePayload", () => {
  it("accepts a well-formed theme payload and applies defaults", () => {
    expect(validatePayload("theme", { light: { "--bg": "white" } })).toEqual({
      light: { "--bg": "white" },
      dark: {},
    })
  })

  it("rejects a token name that could break out of a CSS declaration", () => {
    expect(() =>
      validatePayload("theme", { light: { "--bg:red;color": "blue" } }),
    ).toThrow(ArtifactPayloadError)
  })

  it("rejects a token value carrying a statement terminator", () => {
    expect(() =>
      validatePayload("theme", { light: { "--bg": "red; position: fixed" } }),
    ).toThrow(ArtifactPayloadError)
  })

  it("rejects unknown keys rather than dropping them silently", () => {
    expect(() =>
      validatePayload("theme", { light: {}, dark: {}, smuggled: "value" }),
    ).toThrow(ArtifactPayloadError)
  })

  it("validates each kind against its own schema", () => {
    // A payload valid for one kind must not pass as another.
    expect(() => validatePayload("gradient", { source: "x" })).toThrow(
      ArtifactPayloadError,
    )
    // The old css-based shape (Phase 10b, §10b.2 rewrite) must not validate -
    // `css` is a derived approximation, never the stored source of truth.
    expect(() =>
      validatePayload("gradient", { css: "linear-gradient(red, blue)" }),
    ).toThrow(ArtifactPayloadError)
    expect(
      validatePayload("gradient", {
        formId: "bloom-field",
        geometry: { scale: 1, distortion: 0.5 },
        stops: [{ name: "Start", hex: "#7c3aed" }],
        baseColour: "#0b0b12",
        surface: { blur: 0, grain: 0, edgeShade: 0 },
        motion: { animate: false },
      }),
    ).toEqual({
      formId: "bloom-field",
      geometry: { scale: 1, distortion: 0.5 },
      stops: [{ name: "Start", hex: "#7c3aed" }],
      baseColour: "#0b0b12",
      surface: { blur: 0, grain: 0, edgeShade: 0 },
      motion: { animate: false },
    })
  })
})

describe("ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findUnique.mockResolvedValue(ownedRow)
  })

  it("refuses an update from a non-owner and writes nothing", async () => {
    await expect(
      updateArtifact(ID, OTHER, { name: "hijacked" }),
    ).rejects.toThrow(ArtifactForbiddenError)

    expect(update).not.toHaveBeenCalled()
  })

  it("refuses a delete from a non-owner and writes nothing", async () => {
    await expect(deleteArtifact(ID, OTHER)).rejects.toThrow(
      ArtifactForbiddenError,
    )

    expect(del).not.toHaveBeenCalled()
    // The sweep must not run either - a non-owner must not be able to reach
    // another user's object prefix through a rejected delete.
    expect(deleteR2Prefix).not.toHaveBeenCalled()
  })

  // P11-D1: deleting a row used to leave its R2 objects behind forever.
  it("sweeps the artifact's object prefix after deleting the row", async () => {
    await deleteArtifact(ID, OWNER)

    expect(del).toHaveBeenCalledWith({ where: { id: ID } })
    expect(deleteR2Prefix).toHaveBeenCalledWith({
      // kind/userId/artifactId/ - the namespace the upload route writes into.
      prefix: `theme/${OWNER}/${ID}/`,
      bucketName: "components-code",
    })
  })

  it("still deletes the row when the object sweep fails", async () => {
    // Storage is not the source of truth. An orphaned object costs storage; a
    // row that refuses to delete because R2 is down costs the user their action.
    deleteR2Prefix.mockRejectedValueOnce(new Error("R2 unreachable"))
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {})

    await expect(deleteArtifact(ID, OWNER)).resolves.toBeUndefined()

    expect(del).toHaveBeenCalledWith({ where: { id: ID } })
    // Loud, or orphans accumulate silently - which is how this went unnoticed.
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it("refuses a visibility change from a non-owner", async () => {
    await expect(setArtifactVisibility(ID, OTHER, true)).rejects.toThrow(
      ArtifactForbiddenError,
    )

    expect(update).not.toHaveBeenCalled()
  })

  it("reports a missing row as not-found rather than forbidden", async () => {
    findUnique.mockResolvedValue(null)

    await expect(updateArtifact(ID, OWNER, { name: "x" })).rejects.toThrow(
      ArtifactNotFoundError,
    )
  })

  it("validates an updated payload against the STORED kind, not a supplied one", async () => {
    // The row is a theme. A gradient payload must be rejected even though the
    // caller never says which kind they think it is - the kind is read from the
    // row precisely so a caller cannot choose their own validator.
    await expect(
      updateArtifact(ID, OWNER, { payload: { css: "linear-gradient(a, b)" } }),
    ).rejects.toThrow(ArtifactPayloadError)

    expect(update).not.toHaveBeenCalled()
  })
})

describe("getArtifact", () => {
  beforeEach(() => vi.clearAllMocks())

  it("lets the owner read their own draft", async () => {
    findUnique.mockResolvedValue({
      ...ownedRow,
      is_public: false,
      status: "draft",
    })

    await expect(getArtifact(ID, OWNER)).resolves.toMatchObject({ id: ID })
  })

  it("hides another user's draft", async () => {
    findUnique.mockResolvedValue({
      ...ownedRow,
      is_public: false,
      status: "draft",
    })

    await expect(getArtifact(ID, OTHER)).rejects.toThrow(ArtifactForbiddenError)
  })

  it("hides a public artifact that is still a draft", async () => {
    // is_public alone is not enough; the RLS policy encodes the same pair.
    findUnique.mockResolvedValue({
      ...ownedRow,
      is_public: true,
      status: "draft",
    })

    await expect(getArtifact(ID, OTHER)).rejects.toThrow(ArtifactForbiddenError)
  })

  it("shows a published public artifact to an anonymous viewer", async () => {
    findUnique.mockResolvedValue({
      ...ownedRow,
      is_public: true,
      status: "published",
    })

    await expect(getArtifact(ID, null)).resolves.toMatchObject({ id: ID })
  })
})

describe("createArtifact", () => {
  beforeEach(() => vi.clearAllMocks())

  it("stores the parsed payload and the caller's own user id", async () => {
    await createArtifact(OWNER, {
      kind: "theme",
      name: "Midnight",
      slug: "midnight",
      payload: { light: { "--bg": "white" } },
    })

    expect(create).toHaveBeenCalledTimes(1)
    const args = create.mock.calls[0]?.[0] as { data: Record<string, unknown> }
    expect(args.data.user_id).toBe(OWNER)
    expect(args.data.payload).toEqual({ light: { "--bg": "white" }, dark: {} })
  })

  it("rejects a malformed payload before touching the database", async () => {
    await expect(
      createArtifact(OWNER, {
        kind: "theme",
        name: "Bad",
        slug: "bad",
        payload: { light: { "bg": "white" } },
      }),
    ).rejects.toThrow(ArtifactPayloadError)

    expect(create).not.toHaveBeenCalled()
  })
})
