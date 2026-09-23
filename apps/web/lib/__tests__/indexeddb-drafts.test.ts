// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import {
  saveDraftToStorage,
  loadDraftFromStorage,
  deleteDraftFromStorage,
  hasDraftInStorage,
} from "../indexeddb-drafts"

describe("IndexedDB Draft Store", () => {
  it("handles environment safely when indexedDB is undefined", async () => {
    // In node/test environment without indexedDB polyfill, functions return safely without throwing
    const res = await loadDraftFromStorage("test-key")
    expect(res).toBeNull()

    const has = await hasDraftInStorage("test-key")
    expect(has).toBe(false)

    await expect(saveDraftToStorage("test-key", { text: "hello" })).resolves.not.toThrow()
    await expect(deleteDraftFromStorage("test-key")).resolves.not.toThrow()
  })

  it("stores and retrieves mock structured records when indexedDB is mocked", async () => {
    const store = new Map<string, any>()

    const mockRequest = (result: any, error: any = null) => {
      const req: any = {
        result,
        error,
        set onsuccess(cb: () => void) {
          setTimeout(cb, 0)
        },
        set onerror(cb: () => void) {
          if (error) setTimeout(cb, 0)
        },
      }
      return req
    }

    const mockDb: any = {
      objectStoreNames: { contains: () => true },
      transaction: () => ({
        objectStore: () => ({
          put: (record: any) => {
            store.set(record.key, record)
            return mockRequest(undefined)
          },
          get: (key: string) => {
            return mockRequest(store.get(key) || undefined)
          },
          delete: (key: string) => {
            store.delete(key)
            return mockRequest(undefined)
          },
          getAll: () => {
            return mockRequest(Array.from(store.values()))
          },
        }),
        set oncomplete(cb: () => void) {
          setTimeout(cb, 0)
        },
      }),
      close: vi.fn(),
    }

    const originalIndexedDB = (global as any).indexedDB
    ;(global as any).indexedDB = {
      open: () => mockRequest(mockDb),
    }

    try {
      const draftData = {
        name: "Test Component",
        component_slug: "test-component",
        description: "A description",
        demos: [
          {
            name: "Default Demo",
            tags: [{ name: "React", slug: "react" }],
            preview_image_data_url: "data:image/png;base64,123",
          },
        ],
      }

      await saveDraftToStorage("test-sandbox-1", draftData)

      const exists = await hasDraftInStorage("test-sandbox-1")
      expect(exists).toBe(true)

      const loaded = await loadDraftFromStorage("test-sandbox-1")
      expect(loaded).not.toBeNull()
      expect(loaded?.data).toMatchObject({
        name: "Test Component",
        component_slug: "test-component",
      })

      const allDrafts = await (await import("../indexeddb-drafts")).getAllDrafts()
      expect(allDrafts.size).toBeGreaterThanOrEqual(1)
      expect(allDrafts.get("test-sandbox-1")?.data).toMatchObject({
        name: "Test Component",
      })

      await deleteDraftFromStorage("test-sandbox-1")
      const afterDelete = await loadDraftFromStorage("test-sandbox-1")
      expect(afterDelete).toBeNull()
    } finally {
      ;(global as any).indexedDB = originalIndexedDB
    }
  })
})
