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
import { sourceKey } from "../r2-paths"

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

  it("includes id and username only - never display_username", async () => {
    profile("alice", "Alice B")
    expect([...(await resolveOwnerSegments("u1"))].sort()).toEqual(
      ["alice", "u1"].sort(),
    )
    expect(fromMock).toHaveBeenCalledWith("users")
  })

  // display_username has no uniqueness constraint against ANY column, `id`
  // included: PATCH /api/user/profile checks it only against other rows'
  // username/display_username, so a user can set theirs to a victim's Clerk id.
  it("excludes a display_username forged to equal a victim's user id", async () => {
    profile("attacker", "u2")
    const segments = await resolveOwnerSegments("u1")
    expect(segments.has("u2")).toBe(false)
    expect([...segments].sort()).toEqual(["attacker", "u1"].sort())
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

  // Deliberate behaviour flip: display_username used to grant. It cannot, for
  // the reason given on resolveOwnerSegments above.
  it("denies a {display_username}/ path", async () => {
    profile("alice", "Alice B")
    await expect(assertOwnsR2Path("u1", "Alice B/slug", BUCKET)).rejects.toThrow(
      DENIED,
    )
  })

  it("denies a victim's {userId}/ prefix to an attacker who forged display_username to that id", async () => {
    profile("attacker", "u2")
    await expect(assertOwnsR2Path("u1", "u2/foo/", BUCKET)).rejects.toThrow(
      DENIED,
    )
  })

  it("denies another user's src/-prefixed source path", async () => {
    await expect(
      assertOwnsR2Path("u1", "src/u2/my-card/code.tsx", BUCKET),
    ).rejects.toThrow(DENIED)
    await expect(
      assertOwnsR2Path("u1", "src/bob/my-card/code.tsx", BUCKET),
    ).rejects.toThrow(DENIED)
  })

  // Kind-first ordering must survive the prefix strip. No call site builds this
  // shape today; the pair documents that stripping cannot reopen trap 3.
  it("denies a src/-prefixed kind path belonging to another user", async () => {
    await expect(
      assertOwnsR2Path("u1", "src/ascii/u2/x.png", BUCKET),
    ).rejects.toThrow(DENIED)
  })

  it("denies a bare src/ path with no owner segment", async () => {
    await expect(assertOwnsR2Path("u1", "src/", BUCKET)).rejects.toThrow(DENIED)
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

  // Every real source upload wraps its key in sourceKey() (lib/r2-paths.ts),
  // so these are the shapes publish/import/edit actually send.
  it("allows the caller's own src/{userId}/ source key", async () => {
    await expect(
      assertOwnsR2Path("u1", "src/u1/my-card/code.tsx", BUCKET),
    ).resolves.toBe(undefined)
  })

  it("allows the caller's own src/{username}/ source key", async () => {
    await expect(
      assertOwnsR2Path("u1", sourceKey("alice/my-card/code.1726.tsx"), BUCKET),
    ).resolves.toBe(undefined)
  })

  it("allows a doubly-wrapped sourceKey value (one prefix, stripped once)", async () => {
    const key = sourceKey(sourceKey("alice/my-card/code.tsx"))
    expect(key).toBe("src/alice/my-card/code.tsx")
    await expect(assertOwnsR2Path("u1", key, BUCKET)).resolves.toBe(undefined)
  })

  it("allows the caller's own src/-prefixed kind path", async () => {
    await expect(
      assertOwnsR2Path("u1", "src/ascii/u1/x.png", BUCKET),
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
    await expect(
      assertOwnsR2Path("admin1", "src/bob/their-card/code.tsx", BUCKET),
    ).resolves.toBe(undefined)
    expect(checkIsAdminMock).toHaveBeenCalledWith("admin1")
    expect(fromMock).not.toHaveBeenCalled()
  })
})

/**
 * AC9: the bucket allowlist binds admins too.
 *
 * The admin bypass exists for WHOSE PATH may be written (publish-as), never for
 * WHICH BUCKET. lib/r2.ts holds one account-scoped credential pair and takes
 * Bucket as a per-call argument, so nothing below this module constrains where
 * an unchecked bucketName lands - the allowlist literal is the only in-app
 * restriction. These rows pin the ordering in BOTH directions: tightening the
 * bucket must not cost the publish-as bypass.
 */
describe("assertOwnsR2Path - bucket allowlist binds admins (AC9)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profile("alice")
  })

  // AC9-a: RED before the reorder - the admin early-return ran first, so an
  // admin session could name ANY bucket.
  it("denies an admin naming a bucket other than components-code", async () => {
    admin()
    await expect(
      assertOwnsR2Path("admin1", "bob/their-card/code.tsx", "other-bucket"),
    ).rejects.toThrow("Unauthorized: unexpected bucket")
  })

  it("denies an admin naming another bucket even for their own path", async () => {
    admin()
    await expect(
      assertOwnsR2Path("admin1", "admin1/foo/", "some-private-bucket"),
    ).rejects.toThrow("Unauthorized: unexpected bucket")
  })

  // AC9-b: the publish-as bypass survives the tightening.
  it("still allows an admin naming another user's path in components-code", async () => {
    admin()
    await expect(
      assertOwnsR2Path("admin1", "bob/their-card/code.tsx", BUCKET),
    ).resolves.toBe(undefined)
    expect(checkIsAdminMock).toHaveBeenCalledWith("admin1")
  })

  // AC9-c: the non-admin direction is unchanged.
  it("still denies a non-admin naming a bucket other than components-code", async () => {
    notAdmin()
    await expect(
      assertOwnsR2Path("u1", "u1/foo/", "other-bucket"),
    ).rejects.toThrow("Unauthorized: unexpected bucket")
  })
})
