/**
 * G10a.10 — the ASCII upload route's four controls (Phase 10a, §10a.4).
 *
 * This is the only surface in the phase that takes binary from a browser. The
 * questions worth answering are not "does it upload" but: can an unauthenticated
 * caller reach it, can a signed-in stranger write into someone else's artifact,
 * and can a caller influence *where* the object lands.
 *
 * Content-type and size are enforced by `processUploadBuffer` inside
 * `uploadToR2`, which has its own coverage; here `uploadToR2` is mocked, so what
 * these assert is that the route reaches it with a server-derived key and
 * refuses everything that should never get that far.
 *
 * Not covered: HTTP transport and Next's routing. The handler is invoked
 * directly, same limitation G9.5 records for the server actions.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

const authMock = vi.fn()
const assertOwnedMock = vi.fn()
const uploadMock = vi.fn(async (_args: { fileKey: string }) => "https://cdn.example/obj")

vi.mock("server-only", () => ({}))
vi.mock("@clerk/nextjs/server", () => ({ auth: () => authMock() }))
vi.mock("@/lib/api/server/artifacts", () => ({
  assertOwned: (id: string, userId: string) => assertOwnedMock(id, userId),
}))
vi.mock("@/lib/r2", () => ({
  uploadToR2: (args: { fileKey: string }) => uploadMock(args),
}))

import { POST } from "../route"

const ARTIFACT = "33333333-3333-3333-3333-333333333333"
const OWNER = "user_owner"

const post = (body: unknown) =>
  POST(
    new Request("http://localhost/api/studio/ascii/upload", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  )

const validBody = {
  artifactId: ARTIFACT,
  contentType: "image/png",
  encodedContent: "aGVsbG8=",
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.mockResolvedValue({ userId: OWNER })
  assertOwnedMock.mockResolvedValue({ id: ARTIFACT, user_id: OWNER, kind: "ascii" })
  // Reset the *implementation*, not just the call log: `clearAllMocks` leaves a
  // `mockRejectedValue` from an earlier case in place, which leaks that failure
  // into whichever test happens to run next.
  uploadMock.mockResolvedValue("https://cdn.example/obj")
})

describe("ASCII upload route", () => {
  it("refuses a signed-out caller and never touches storage", async () => {
    authMock.mockResolvedValue({ userId: null })

    const res = await post(validBody)

    expect(res.status).toBe(401)
    expect(uploadMock).not.toHaveBeenCalled()
    expect(assertOwnedMock).not.toHaveBeenCalled()
  })

  it("refuses a non-owner and never touches storage", async () => {
    assertOwnedMock.mockRejectedValue(new Error("Forbidden"))

    const res = await post(validBody)

    expect(res.status).toBe(404)
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it("checks ownership against the authenticated user, not anything in the body", async () => {
    // The body cannot carry a user id, but if someone later adds one to the
    // schema this asserts the route still authorises against the session.
    await post({ ...validBody, userId: "user_someone_else" })

    expect(assertOwnedMock).toHaveBeenCalledWith(ARTIFACT, OWNER)
  })

  it("derives the object key server-side and ignores any client-supplied key", async () => {
    await post({ ...validBody, key: "../../etc/passwd", fileKey: "/tmp/evil.png" })

    expect(uploadMock).toHaveBeenCalledTimes(1)
    const args = uploadMock.mock.calls[0]![0]

    expect(args.fileKey).toMatch(
      new RegExp(`^ascii/${OWNER}/${ARTIFACT}/[0-9a-f-]{36}\\.png$`),
    )
    expect(args.fileKey).not.toContain("..")
    expect(args.fileKey).not.toContain("etc/passwd")
    expect(args.fileKey.startsWith("/")).toBe(false)
  })

  it("rejects a content type the renderer cannot sample", async () => {
    for (const contentType of [
      "image/svg+xml",
      "image/gif",
      "text/html",
      "application/octet-stream",
    ]) {
      const res = await post({ ...validBody, contentType })
      expect(res.status).toBe(400)
    }
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it("refuses to write into an artifact of another kind", async () => {
    assertOwnedMock.mockResolvedValue({ id: ARTIFACT, user_id: OWNER, kind: "theme" })

    const res = await post(validBody)

    expect(res.status).toBe(400)
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it("surfaces a storage rejection as a client error, not a 500", async () => {
    // processUploadBuffer throws for a magic-byte mismatch or an oversized
    // buffer; both are the caller's fault.
    uploadMock.mockRejectedValue(new Error("Image file exceeds maximum allowed limit of 10MB"))

    const res = await post(validBody)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: expect.stringContaining("10MB") })
  })

  it("rejects a malformed body and a non-uuid artifact id", async () => {
    const bad = await POST(
      new Request("http://localhost/api/studio/ascii/upload", {
        method: "POST",
        body: "not json",
      }),
    )
    expect(bad.status).toBe(400)

    const notUuid = await post({ ...validBody, artifactId: "1; drop table" })
    expect(notUuid.status).toBe(400)
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it("returns the key it stored, so the payload records the server's value", async () => {
    const res = await post(validBody)

    expect(res.status).toBe(200)
    const json = (await res.json()) as { key: string; url: string }
    const args = uploadMock.mock.calls[0]![0]
    expect(json.key).toBe(args.fileKey)
  })
})
