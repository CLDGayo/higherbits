/**
 * B3: every R2 server action must refuse a path the caller does not own
 * BEFORE touching S3, and must keep working for owners and admins.
 * All S3 / Clerk / Supabase calls are mocked - nothing reaches production R2.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

const m = vi.hoisted(() => {
  const maybeSingle = vi.fn()
  return {
    auth: vi.fn(),
    checkIsAdmin: vi.fn(),
    maybeSingle,
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle }) }),
    })),
    send: vi.fn(),
    getSignedUrl: vi.fn(),
  }
})

vi.mock("@clerk/nextjs/server", () => ({ auth: m.auth }))
vi.mock("../admin", () => ({ checkIsAdmin: m.checkIsAdmin }))
vi.mock("../supabase", () => ({ supabaseWithAdminAccess: { from: m.from } }))
vi.mock("../upload-security", () => ({
  processUploadBuffer: vi.fn(async ({ buffer }: { buffer: Buffer }) => ({
    sanitizedBuffer: buffer,
    contentType: "text/plain",
  })),
}))
vi.mock("@aws-sdk/client-s3", () => {
  class Cmd {
    input: any
    constructor(input: any) {
      this.input = input
    }
  }
  return {
    S3Client: class {
      send = m.send
    },
    PutObjectCommand: class extends Cmd {},
    ListObjectsV2Command: class extends Cmd {},
    DeleteObjectsCommand: class extends Cmd {},
  }
})
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: m.getSignedUrl,
}))

import { deleteR2Prefix, generatePresignedUrl, uploadToR2 } from "../r2"

const BUCKET = "components-code"
const DENIED = "Unauthorized: path does not belong to caller"
const file = { name: "code.tsx", type: "text/plain", textContent: "x" }
const env = process.env as Record<string, string | undefined>

const as = (userId: string, isAdmin = false) => {
  m.auth.mockResolvedValue({ userId })
  m.checkIsAdmin.mockResolvedValue({ isAdmin, error: null })
  m.maybeSingle.mockResolvedValue({
    data: { username: "alice", display_username: null },
    error: null,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  env["R2_ACCESS_KEY_ID"] = "test"
  env["R2_SECRET_ACCESS_KEY"] = "test"
  env["NEXT_PUBLIC_R2_ENDPOINT"] = "https://r2.invalid"
  env["NEXT_PUBLIC_CDN_URL"] = "https://cdn.invalid"
  m.getSignedUrl.mockResolvedValue("https://signed.invalid")
  m.send.mockImplementation(async (cmd: { input: { Prefix?: string } }) =>
    cmd.input.Prefix !== undefined
      ? { Contents: [{ Key: `${cmd.input.Prefix}a.png` }], IsTruncated: false }
      : {},
  )
})

describe("r2 server actions - DENY non-owner before S3", () => {
  it("still rejects an unauthenticated caller", async () => {
    m.auth.mockResolvedValue({ userId: null })
    await expect(
      deleteR2Prefix({ prefix: "u1/foo/", bucketName: BUCKET }),
    ).rejects.toThrow("Unauthorized")
    expect(m.send).not.toHaveBeenCalled()
  })

  it("deleteR2Prefix refuses another user's prefix", async () => {
    as("u1")
    await expect(
      deleteR2Prefix({ prefix: "u2/foo/", bucketName: BUCKET }),
    ).rejects.toThrow(DENIED)
    expect(m.send).not.toHaveBeenCalled()
  })

  it("deleteR2Prefix refuses another user's artifact sweep prefix", async () => {
    as("u1")
    await expect(
      deleteR2Prefix({ prefix: "shader/u2/art/", bucketName: BUCKET }),
    ).rejects.toThrow(DENIED)
    expect(m.send).not.toHaveBeenCalled()
  })

  it("uploadToR2 refuses another user's key", async () => {
    as("u1")
    await expect(
      uploadToR2({ file, fileKey: "bob/card/code.tsx", bucketName: BUCKET }),
    ).rejects.toThrow(DENIED)
    expect(m.send).not.toHaveBeenCalled()
  })

  it("generatePresignedUrl refuses another user's key", async () => {
    as("u1")
    await expect(
      generatePresignedUrl({ fileKey: "u2/video.mp4", bucketName: BUCKET }),
    ).rejects.toThrow(DENIED)
    expect(m.getSignedUrl).not.toHaveBeenCalled()
  })
})

describe("r2 server actions - ALLOW owner and admin", () => {
  it("uploadToR2 succeeds for own id and own username keys", async () => {
    as("u1")
    await expect(
      uploadToR2({ file, fileKey: "u1/card/code.tsx", bucketName: BUCKET }),
    ).resolves.toBe("https://cdn.invalid/u1/card/code.tsx")
    await expect(
      uploadToR2({ file, fileKey: "alice/card/code.tsx", bucketName: BUCKET }),
    ).resolves.toBe("https://cdn.invalid/alice/card/code.tsx")
    expect(m.send).toHaveBeenCalledTimes(2)
  })

  it("uploadToR2 succeeds for own ascii artifact key", async () => {
    as("u1")
    await expect(
      uploadToR2({
        file,
        fileKey: "ascii/u1/art-1/uuid.png",
        bucketName: BUCKET,
      }),
    ).resolves.toBe("https://cdn.invalid/ascii/u1/art-1/uuid.png")
  })

  it.each(["ascii", "theme", "gradient", "shader"])(
    "deleteR2Prefix succeeds for own %s artifact sweep prefix",
    async (kind) => {
      as("u1")
      await expect(
        deleteR2Prefix({ prefix: `${kind}/u1/art-1/`, bucketName: BUCKET }),
      ).resolves.toBe(1)
    },
  )

  it("generatePresignedUrl succeeds for own key", async () => {
    as("u1")
    await expect(
      generatePresignedUrl({ fileKey: "u1/video.mp4", bucketName: BUCKET }),
    ).resolves.toBe("https://signed.invalid")
  })

  it("all three succeed for an admin publishing as another user", async () => {
    as("admin1", true)
    await expect(
      uploadToR2({ file, fileKey: "bob/card/code.tsx", bucketName: BUCKET }),
    ).resolves.toBe("https://cdn.invalid/bob/card/code.tsx")
    await expect(
      generatePresignedUrl({ fileKey: "bob/video.mp4", bucketName: BUCKET }),
    ).resolves.toBe("https://signed.invalid")
    await expect(
      deleteR2Prefix({ prefix: "u2/foo/", bucketName: BUCKET }),
    ).resolves.toBe(1)
  })
})
