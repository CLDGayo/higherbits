/**
 * B3: R2 path ownership. Proves BOTH directions - a check that only denies
 * would pass a fix that bricks publishing; a check that only allows would pass
 * a fix that changes nothing.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

const { checkIsAdminMock, maybeSingleMock, fromMock } = vi.hoisted(() => {
  const maybeSingleMock = vi.fn()
  const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
  const selectMock = vi.fn(() => ({ eq: eqMock }))
  const fromMock = vi.fn(() => ({ select: selectMock }))
  return { checkIsAdminMock: vi.fn(), maybeSingleMock, fromMock }
})

vi.mock("../admin", () => ({ checkIsAdmin: checkIsAdminMock }))
vi.mock("../supabase", () => ({
  supabaseWithAdminAccess: { from: fromMock },
}))

import { assertOwnsR2Path, resolveOwnerSegments } from "../r2-ownership"

const BUCKET = "components-code"
const DENIED = "Unauthorized: path does not belong to caller"

// Real shape of lib/admin.ts checkIsAdmin (EI-2): an object, never a bare bool.
const notAdmin = () =>
  checkIsAdminMock.mockResolvedValue({ isAdmin: false, error: null })
const admin = () =>
  checkIsAdminMock.mockResolvedValue({ isAdmin: true, error: null })
const profile = (
  username: string | null,
  display_username: string | null = null,
) =>
  maybeSingleMock.mockResolvedValue({
    data: { username, display_username },
    error: null,
  })

describe("resolveOwnerSegments", () => {
  beforeEach(() => vi.clearAllMocks())

  it("includes id, username and display_username", async () => {
    profile("alice", "Alice B")
    expect([...(await resolveOwnerSegments("u1"))].sort()).toEqual(
      ["Alice B", "alice", "u1"].sort(),
    )
    expect(fromMock).toHaveBeenCalledWith("users")
  })

  it("fails closed to only the id on a lookup error", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: "x" } })
    expect([...(await resolveOwnerSegments("u1"))]).toEqual(["u1"])
  })

  it("fails closed to only the id when no row exists", async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null })
    expect([...(await resolveOwnerSegments("u1"))]).toEqual(["u1"])
  })
})

describe("assertOwnsR2Path - DENY (non-owner, non-admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notAdmin()
    profile("alice")
  })

  it("denies another user's {userId}/ prefix", async () => {
    await expect(assertOwnsR2Path("u1", "u2/foo/", BUCKET)).rejects.toThrow(
      DENIED,
    )
  })

  it("denies another user's {userId}/ file key", async () => {
    await expect(
      assertOwnsR2Path("u1", "u2/bundle.tsx", BUCKET),
    ).rejects.toThrow(DENIED)
  })

  it("denies another user's {username}/ path", async () => {
    await expect(
      assertOwnsR2Path("u1", "bob/my-card/code.tsx", BUCKET),
    ).rejects.toThrow(DENIED)
  })

  it.each(["ascii", "theme", "gradient", "shader"])(
    "denies another user's %s/{userId}/ path",
    async (kind) => {
      await expect(
        assertOwnsR2Path("u1", `${kind}/u2/artifact/`, BUCKET),
      ).rejects.toThrow(DENIED)
    },
  )

  it("trap 3: denies {victim}/{attacker-own-id}/ (victim posing as a kind)", async () => {
    await expect(
      assertOwnsR2Path("u1", "u2/u1/x.png", BUCKET),
    ).rejects.toThrow(DENIED)
    await expect(
      assertOwnsR2Path("u1", "bob/alice/x.png", BUCKET),
    ).rejects.toThrow(DENIED)
  })

  it("denies an unknown first segment even when the second is the caller's id", async () => {
    await expect(
      assertOwnsR2Path("u1", "videos/u1/x.mp4", BUCKET),
    ).rejects.toThrow(DENIED)
  })

  it("denies a user whose username equals a kind naming a victim's artifact prefix", async () => {
    profile("ascii")
    await expect(
      assertOwnsR2Path("u1", "ascii/u2/artifact/", BUCKET),
    ).rejects.toThrow(DENIED)
  })

  it("denies a single-segment path that is not the caller", async () => {
    await expect(assertOwnsR2Path("u1", "u2", BUCKET)).rejects.toThrow(DENIED)
  })

  it("trap 4: an { isAdmin: false } object does not grant the admin bypass", async () => {
    checkIsAdminMock.mockResolvedValue({ isAdmin: false, error: null })
    await expect(assertOwnsR2Path("u1", "u2/foo/", BUCKET)).rejects.toThrow(
      DENIED,
    )
    expect(checkIsAdminMock).toHaveBeenCalledWith("u1")
  })

  it("denies a bucket other than components-code even for an owned path", async () => {
    await expect(
      assertOwnsR2Path("u1", "u1/foo/", "other-bucket"),
    ).rejects.toThrow("Unauthorized: unexpected bucket")
  })
})

describe("assertOwnsR2Path - ALLOW", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    notAdmin()
    profile("alice", "Alice B")
  })

  it("allows the caller's own {userId}/ prefix", async () => {
    await expect(assertOwnsR2Path("u1", "u1/foo/", BUCKET)).resolves.toBe(
      undefined,
    )
  })

  it("allows the caller's own {username}/ path", async () => {
    await expect(
      assertOwnsR2Path("u1", "alice/my-card/code.tsx", BUCKET),
    ).resolves.toBe(undefined)
  })

  it("allows the caller's own {display_username}/ path", async () => {
    await expect(
      assertOwnsR2Path("u1", "Alice B/slug", BUCKET),
    ).resolves.toBe(undefined)
  })

  it("allows the caller's own ascii upload key", async () => {
    await expect(
      assertOwnsR2Path("u1", "ascii/u1/artifact-1/uuid.png", BUCKET),
    ).resolves.toBe(undefined)
  })

  it.each(["ascii", "theme", "gradient", "shader"])(
    "allows deleteArtifact's own sweep prefix %s/{userId}/{id}/",
    async (kind) => {
      await expect(
        assertOwnsR2Path("u1", `${kind}/u1/artifact-1/`, BUCKET),
      ).resolves.toBe(undefined)
    },
  )

  it("allows an admin naming another user's path, resolved from the session id", async () => {
    admin()
    await expect(
      assertOwnsR2Path("admin1", "bob/their-card/code.tsx", BUCKET),
    ).resolves.toBe(undefined)
    await expect(
      assertOwnsR2Path("admin1", "u2/foo/", BUCKET),
    ).resolves.toBe(undefined)
    expect(checkIsAdminMock).toHaveBeenCalledWith("admin1")
    expect(fromMock).not.toHaveBeenCalled()
  })
})
