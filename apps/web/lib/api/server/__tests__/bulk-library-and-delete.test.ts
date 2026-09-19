import { beforeEach, describe, expect, it, vi } from "vitest"

const findUniqueCollection = vi.fn()
const findUniqueComponent = vi.fn()
const deleteMany = vi.fn((_args: unknown) => ({ op: "deleteMany" }))
const deleteComponentPrisma = vi.fn(async (_args: unknown) => ({}))
const upsert = vi.fn((_args: unknown) => ({ op: "upsert" }))
const $transaction = vi.fn(async (ops: unknown[]) => ops)

vi.mock("server-only", () => ({}))
vi.mock("../../../prisma", () => ({
  default: {
    collections: {
      findUnique: (...args: unknown[]) => findUniqueCollection(...args),
      update: vi.fn(async () => ({})),
    },
    components: {
      findUnique: (...args: unknown[]) => findUniqueComponent(...args),
      delete: (...args: unknown[]) => deleteComponentPrisma(...args),
    },
    components_to_collections: {
      deleteMany: (args: unknown) => deleteMany(args),
      upsert: (args: unknown) => upsert(args),
    },
    $transaction: (ops: unknown[]) => $transaction(ops),
  },
}))

const mockCheckIsAdmin = vi.fn()
vi.mock("../../../admin", () => ({
  checkIsAdmin: (userId: string) => mockCheckIsAdmin(userId),
}))

import {
  moveComponentToLibrary,
  removeComponentFromAllLibraries,
} from "../collections"
import { deleteComponent } from "../components"

const LIBRARY_ID = "11111111-1111-1111-1111-111111111111"
const OWNER = "user_owner"
const ADMIN = "user_admin"
const STRANGER = "user_stranger"

describe("bulk library actions & admin privileges", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCheckIsAdmin.mockImplementation(async (userId: string) => ({
      isAdmin: userId === ADMIN,
      error: null,
    }))
    findUniqueCollection.mockResolvedValue({ id: LIBRARY_ID, user_id: OWNER })
    findUniqueComponent.mockResolvedValue({ id: 42, user_id: OWNER })
  })

  describe("moveComponentToLibrary admin support", () => {
    it("allows admin to move component into a creator library", async () => {
      findUniqueCollection.mockResolvedValue({ id: LIBRARY_ID, user_id: OWNER })

      await moveComponentToLibrary(LIBRARY_ID, 42, ADMIN)

      expect(deleteMany).toHaveBeenCalledTimes(1)
      expect(deleteMany.mock.calls[0]?.[0]).toEqual({
        where: {
          component_id: 42,
          collection_id: { not: LIBRARY_ID },
          collections: { user_id: OWNER },
        },
      })
      expect(upsert).toHaveBeenCalledTimes(1)
    })

    it("rejects unauthorized stranger moving component into library", async () => {
      findUniqueCollection.mockResolvedValue({ id: LIBRARY_ID, user_id: OWNER })

      await expect(
        moveComponentToLibrary(LIBRARY_ID, 42, STRANGER),
      ).rejects.toThrow("Unauthorized to modify this library")
    })
  })

  describe("removeComponentFromAllLibraries", () => {
    it("allows owner to remove component from all their libraries", async () => {
      await removeComponentFromAllLibraries(42, OWNER)

      expect(deleteMany).toHaveBeenCalledWith({
        where: {
          component_id: 42,
          collections: { user_id: OWNER },
        },
      })
    })

    it("allows admin to remove component from all libraries of target user", async () => {
      await removeComponentFromAllLibraries(42, ADMIN, OWNER)

      expect(deleteMany).toHaveBeenCalledWith({
        where: {
          component_id: 42,
          collections: { user_id: OWNER },
        },
      })
    })

    it("rejects unauthorized stranger from removing component from all libraries", async () => {
      await expect(
        removeComponentFromAllLibraries(42, STRANGER),
      ).rejects.toThrow("Unauthorized to remove component from libraries")
    })
  })

  describe("deleteComponent admin & owner permissions", () => {
    it("allows component owner to delete component", async () => {
      await deleteComponent(42, OWNER)

      expect(deleteComponentPrisma).toHaveBeenCalledWith({
        where: { id: 42 },
      })
    })

    it("allows admin to delete component", async () => {
      await deleteComponent(42, ADMIN)

      expect(deleteComponentPrisma).toHaveBeenCalledWith({
        where: { id: 42 },
      })
    })

    it("refuses unauthorized stranger to delete component", async () => {
      await expect(deleteComponent(42, STRANGER)).rejects.toThrow(
        "Unauthorized to delete this component",
      )
      expect(deleteComponentPrisma).not.toHaveBeenCalled()
    })
  })
})
