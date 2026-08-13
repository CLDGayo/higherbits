import { beforeEach, describe, expect, it, vi } from "vitest"

const findUnique = vi.fn()
const deleteMany = vi.fn(() => ({ op: "deleteMany" }))
const upsert = vi.fn(() => ({ op: "upsert" }))
const $transaction = vi.fn(async (ops: unknown[]) => ops)

vi.mock("server-only", () => ({}))
vi.mock("../../../prisma", () => ({
  default: {
    collections: { findUnique: (...args: unknown[]) => findUnique(...args) },
    components_to_collections: {
      deleteMany: (...args: unknown[]) => deleteMany(...args),
      upsert: (...args: unknown[]) => upsert(...args),
    },
    $transaction: (ops: unknown[]) => $transaction(ops),
  },
}))

import { moveComponentToLibrary } from "../collections"

const LIBRARY_ID = "11111111-1111-1111-1111-111111111111"
const OWNER = "user_owner"

describe("moveComponentToLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    findUnique.mockResolvedValue({ id: LIBRARY_ID, user_id: OWNER })
  })

  it("refuses a library the caller does not own", async () => {
    findUnique.mockResolvedValue({ id: LIBRARY_ID, user_id: "someone_else" })

    await expect(moveComponentToLibrary(LIBRARY_ID, 42, OWNER)).rejects.toThrow(
      "Unauthorized to modify this library",
    )

    expect(deleteMany).not.toHaveBeenCalled()
    expect(upsert).not.toHaveBeenCalled()
  })

  it("clears only the caller's other libraries, never another user's", async () => {
    await moveComponentToLibrary(LIBRARY_ID, 42, OWNER)

    expect(deleteMany).toHaveBeenCalledTimes(1)
    expect(deleteMany.mock.calls[0][0]).toEqual({
      where: {
        component_id: 42,
        collection_id: { not: LIBRARY_ID },
        // The scope that stops a move out of your library from also evicting
        // the component from a library somebody else owns.
        collections: { user_id: OWNER },
      },
    })
  })

  it("adds to the destination library idempotently", async () => {
    await moveComponentToLibrary(LIBRARY_ID, 42, OWNER)

    expect(upsert).toHaveBeenCalledTimes(1)
    expect(upsert.mock.calls[0][0]).toEqual({
      where: {
        collection_id_component_id: {
          collection_id: LIBRARY_ID,
          component_id: 42,
        },
      },
      create: { collection_id: LIBRARY_ID, component_id: 42 },
      update: {},
    })
  })

  it("runs the clear and the add in one transaction", async () => {
    await moveComponentToLibrary(LIBRARY_ID, 42, OWNER)

    // Both statements must commit together, or a failed add would leave the
    // component sitting in no library at all.
    expect($transaction).toHaveBeenCalledTimes(1)
    expect($transaction.mock.calls[0][0]).toHaveLength(2)
  })
})
