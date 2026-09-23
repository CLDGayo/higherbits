/**
 * Client-side IndexedDB Draft Store for HigherBits.dev
 *
 * Supports storing large form data including texts, images (File/Blob/Base64),
 * and videos (File/Blob) without hitting localStorage 5MB quota restrictions.
 */

const DB_NAME = "higherbits_drafts_db"
const DB_VERSION = 1
const STORE_NAME = "publish_drafts"

function getIndexedDB(): IDBFactory | undefined {
  if (typeof indexedDB !== "undefined") return indexedDB
  if (typeof window !== "undefined" && typeof window.indexedDB !== "undefined") return window.indexedDB
  return undefined
}

function isClientEnvironment(): boolean {
  return !!getIndexedDB()
}

interface SerializedFileMetadata {
  __isFileBlob: true
  name: string
  type: string
  lastModified: number
  data: Blob
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const idb = getIndexedDB()
    if (!idb) {
      reject(new Error("IndexedDB is only supported in browser environments"))
      return
    }

    const request = idb.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Prepares data for storage by normalizing File instances to { metadata, blob }
 * to guarantee cross-browser cloning stability in IndexedDB.
 */
function prepareForStorage(value: any): any {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof File !== "undefined" && value instanceof File) {
    const serialized: SerializedFileMetadata = {
      __isFileBlob: true,
      name: value.name,
      type: value.type,
      lastModified: value.lastModified,
      data: value.slice(0, value.size, value.type),
    }
    return serialized
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => prepareForStorage(item))
  }

  if (typeof value === "object") {
    const copy: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      copy[k] = prepareForStorage(v)
    }
    return copy
  }

  return value
}

/**
 * Restores File instances from serialized metadata upon loading from storage.
 */
function restoreFromStorage(value: any): any {
  if (value === null || value === undefined) {
    return value
  }

  if (
    typeof value === "object" &&
    value.__isFileBlob === true &&
    value.data instanceof Blob
  ) {
    try {
      return new File([value.data], value.name, {
        type: value.type,
        lastModified: value.lastModified,
      })
    } catch {
      return value.data
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => restoreFromStorage(item))
  }

  if (typeof value === "object") {
    const copy: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      copy[k] = restoreFromStorage(v)
    }
    return copy
  }

  return value
}

export interface StoredDraftRecord<T = any> {
  key: string
  data: T
  updatedAt: number
}

/**
 * Save draft data to IndexedDB.
 */
export async function saveDraftToStorage<T = any>(
  key: string,
  data: T,
): Promise<void> {
  if (!isClientEnvironment()) return

  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      const preparedData = prepareForStorage(data)
      const record: StoredDraftRecord = {
        key,
        data: preparedData,
        updatedAt: Date.now(),
      }

      const request = store.put(record)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.warn(`[DraftStore] Failed to save draft for "${key}":`, error)
  }
}

/**
 * Load draft data from IndexedDB.
 */
export async function loadDraftFromStorage<T = any>(
  key: string,
): Promise<{ data: T; updatedAt: number } | null> {
  if (!isClientEnvironment()) return null

  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onsuccess = () => {
        const record = request.result as StoredDraftRecord | undefined
        if (!record || !record.data) {
          resolve(null)
          return
        }

        const restoredData = restoreFromStorage(record.data) as T
        resolve({
          data: restoredData,
          updatedAt: record.updatedAt || Date.now(),
        })
      }

      request.onerror = () => reject(request.error)
      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.warn(`[DraftStore] Failed to load draft for "${key}":`, error)
    return null
  }
}

/**
 * Delete a draft record from IndexedDB.
 */
export async function deleteDraftFromStorage(key: string): Promise<void> {
  if (!isClientEnvironment()) return

  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.warn(`[DraftStore] Failed to delete draft for "${key}":`, error)
  }
}

/**
 * Check if a draft exists for a key.
 */
export async function hasDraftInStorage(key: string): Promise<boolean> {
  if (!isClientEnvironment()) return false

  try {
    const record = await loadDraftFromStorage(key)
    return record !== null
  } catch {
    return false
  }
}

/**
 * Get all stored drafts from IndexedDB as a Map of key -> { data, updatedAt }.
 */
export async function getAllDrafts<T = any>(): Promise<
  Map<string, { data: T; updatedAt: number }>
> {
  if (!isClientEnvironment()) return new Map()

  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly")
      const store = transaction.objectStore(STORE_NAME)
      if (typeof store.getAll === "function") {
        const request = store.getAll()

        request.onsuccess = () => {
          const records = (request.result || []) as StoredDraftRecord[]
          const map = new Map<string, { data: T; updatedAt: number }>()
          for (const record of records) {
            if (record && record.key && record.data) {
              const restoredData = restoreFromStorage(record.data) as T
              map.set(record.key, {
                data: restoredData,
                updatedAt: record.updatedAt || Date.now(),
              })
            }
          }
          resolve(map)
        }

        request.onerror = () => reject(request.error)
      } else if (typeof store.openCursor === "function") {
        const map = new Map<string, { data: T; updatedAt: number }>()
        const request = store.openCursor()

        request.onsuccess = (event: any) => {
          const cursor = event.target.result as IDBCursorWithValue | null
          if (cursor) {
            const record = cursor.value as StoredDraftRecord
            if (record && record.key && record.data) {
              const restoredData = restoreFromStorage(record.data) as T
              map.set(record.key, {
                data: restoredData,
                updatedAt: record.updatedAt || Date.now(),
              })
            }
            cursor.continue()
          } else {
            resolve(map)
          }
        }

        request.onerror = () => reject(request.error)
      } else {
        resolve(new Map())
      }
      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.warn("[DraftStore] Failed to get all drafts:", error)
    return new Map()
  }
}

