/**
 * G9.5 — ownership enforcement at the layer a caller actually reaches.
 *
 * lib/api/server/__tests__/artifacts.test.ts already proves the service module
 * refuses a non-owner. It proves it by passing a `userId` argument, which the
 * service trusts. This file covers the question that leaves open: can a caller
 * influence which `userId` the service is handed?
 *
 * That matters more here than it looks. `relforcerowsecurity` is false on every
 * table and the server talks to Postgres as `service_role`, so RLS is bypassed
 * entirely on this path -- the action layer is the only access control there is.
 *
 * Not covered: HTTP transport. These call the server actions directly rather
 * than over the wire, so Next's own server-action dispatch is out of scope.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

const authMock = vi.fn()
const findUnique = vi.fn()
const findFirst = vi.fn()
const update = vi.fn(async (_args: unknown) => ({ ok: true }))
const del = vi.fn(async (_args: unknown) => ({ ok: true }))
const create = vi.fn(async (args: any) => ({ ok: true, ...args?.data }))

vi.mock("server-only", () => ({}))
vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }))
vi.mock("../../prisma", () => ({
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
  createArtifactAction,
  deleteArtifactAction,
  getArtifactAction,
  setArtifactStatusAction,
  setArtifactVisibilityAction,
  updateArtifactAction,
} from "../artifacts"
import { ArtifactForbiddenError } from "../server/artifacts"

const ID = "22222222-2222-2222-2222-222222222222"
const OWNER = "user_owner"
const ATTACKER = "user_attacker"
const THEME = { light: { "--bg": "white" } }

const noWrites = () => {
  expect(update).not.toHaveBeenCalled()
  expect(del).not.toHaveBeenCalled()
  expect(create).not.toHaveBeenCalled()
}

beforeEach(() => {
  vi.clearAllMocks()
  // Every stored row belongs to OWNER.
  findUnique.mockResolvedValue({ id: ID, user_id: OWNER, kind: "theme" })
})

describe("signed out", () => {
  beforeEach(() => authMock.mockResolvedValue({ userId: null }))

  it("refuses every mutation and writes nothing", async () => {
    await expect(
      createArtifactAction({ kind: "theme", name: "n", slug: "s", payload: THEME }),
    ).rejects.toThrow("Unauthorized")
    await expect(updateArtifactAction({ id: ID, name: "x" })).rejects.toThrow(
      "Unauthorized",
    )
    await expect(deleteArtifactAction({ id: ID })).rejects.toThrow("Unauthorized")
    await expect(
      setArtifactVisibilityAction({ id: ID, isPublic: true }),
    ).rejects.toThrow("Unauthorized")
    await expect(
      setArtifactStatusAction({ id: ID, status: "published" }),
    ).rejects.toThrow("Unauthorized")

    noWrites()
  })

  it("still allows a read, which is deliberate", async () => {
    // getArtifact refuses anything not both public AND published, so anonymous
    // read-through is intended rather than an oversight. Locked so it is not
    // "fixed" into a 401 by someone reading the block above.
    findUnique.mockResolvedValue({
      id: ID,
      user_id: OWNER,
      kind: "theme",
      status: "published",
      is_public: true,
      payload: THEME,
    })
    await expect(getArtifactAction({ id: ID })).resolves.toBeTruthy()
  })
})

describe("signed in as somebody else", () => {
  beforeEach(() => authMock.mockResolvedValue({ userId: ATTACKER }))

  it("refuses an update to another user's artifact and writes nothing", async () => {
    await expect(
      updateArtifactAction({ id: ID, name: "hijacked" }),
    ).rejects.toThrow(ArtifactForbiddenError)
    noWrites()
  })

  it("refuses a delete of another user's artifact and writes nothing", async () => {
    await expect(deleteArtifactAction({ id: ID })).rejects.toThrow(
      ArtifactForbiddenError,
    )
    noWrites()
  })

  it("refuses to publish another user's artifact", async () => {
    await expect(
      setArtifactStatusAction({ id: ID, status: "published" }),
    ).rejects.toThrow(ArtifactForbiddenError)
    noWrites()
  })

  it("refuses to make another user's private artifact public", async () => {
    await expect(
      setArtifactVisibilityAction({ id: ID, isPublic: true }),
    ).rejects.toThrow(ArtifactForbiddenError)
    noWrites()
  })

  it("cannot forge ownership through the input envelope", async () => {
    // No action takes a user id, and the zod envelopes strip unknown keys, so a
    // smuggled owner must not reach the database. If someone later adds
    // `user_id` to createSchema, this fails.
    await createArtifactAction({
      kind: "theme",
      name: "n",
      slug: "s",
      payload: THEME,
      user_id: OWNER,
      userId: OWNER,
    } as any)

    expect(create).toHaveBeenCalledTimes(1)
    const data = (create.mock.calls[0]![0] as any).data
    expect(data.user_id).toBe(ATTACKER)
    expect(data.user_id).not.toBe(OWNER)
  })
})

describe("signed in as the owner", () => {
  // Control. Without this the refusals above could pass for the wrong reason.
  beforeEach(() => authMock.mockResolvedValue({ userId: OWNER }))

  it("allows the owner to update, publish and delete", async () => {
    await expect(
      updateArtifactAction({ id: ID, name: "fine" }),
    ).resolves.toMatchObject({ ok: true })
    expect(update).toHaveBeenCalled()

    await expect(
      setArtifactVisibilityAction({ id: ID, isPublic: true }),
    ).resolves.toBeTruthy()

    await expect(deleteArtifactAction({ id: ID })).resolves.toEqual({
      success: true,
    })
    expect(del).toHaveBeenCalled()
  })
})
