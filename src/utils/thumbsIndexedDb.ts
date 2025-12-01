// src/utils/thumbsIndexedDb.ts
import type { Thumbnail } from './thumbCache'

const DB_NAME = 'vp-thumbs-cache'
const STORE_NAME = 'thumbs'
const DB_VERSION = 1

type StoredThumbs = {
  key: string
  sig: string
  createdAt: number
  items: { t: number; dataUrl: string }[]
}

const buildKey = (projectId: string, clipId: number | string) => `${projectId}:${clipId}`

function isBrowserReady() {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined'
}

function openDb(): Promise<IDBDatabase | null> {
  if (!isBrowserReady()) return Promise.resolve(null)
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => resolve(null)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

function fetchAsDataUrl(url: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('No se pudo leer el blob'))
      reader.onloadend = () => resolve(String(reader.result))
      reader.readAsDataURL(blob)
    } catch (error) {
      reject(error)
    }
  })
}

export async function loadThumbsFromIndexedDb(
  projectId: string,
  clipId: number | string,
  sig: string
): Promise<Thumbnail[] | null> {
  try {
    const db = await openDb()
    if (!db) return null

    const key = buildKey(projectId, clipId)
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(key)

    return await new Promise((resolve) => {
      request.onerror = () => resolve(null)
      request.onsuccess = () => {
        const found = request.result as StoredThumbs | undefined
        if (!found || found.sig !== sig || !Array.isArray(found.items)) {
          resolve(null)
          return
        }
        const items = found.items.map((it) => ({ t: Number(it.t) || 0, url: String(it.dataUrl) }))
        console.log('[IndexedDB] Miniaturas recuperadas', { projectId, clipId, count: items.length })
        resolve(items)
      }
    })
  } catch (error) {
    console.warn('[IndexedDB] Error leyendo miniaturas', error)
    return null
  }
}

export async function saveThumbsToIndexedDb(
  projectId: string,
  clipId: number | string,
  sig: string,
  items: Thumbnail[]
) {
  try {
    const db = await openDb()
    if (!db) return

    const serialized = await Promise.all(
      items.map(async (item) => {
        if (!item.url) return { t: item.t, dataUrl: '' }
        if (item.url.startsWith('data:')) return { t: item.t, dataUrl: item.url }
        try {
          const dataUrl = await fetchAsDataUrl(item.url)
          return { t: item.t, dataUrl }
        } catch {
          return { t: item.t, dataUrl: '' }
        }
      })
    )

    const key = buildKey(projectId, clipId)
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put({ key, sig, createdAt: Date.now(), items: serialized })

    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    })
    console.log('[IndexedDB] Miniaturas almacenadas', { projectId, clipId, count: items.length })
  } catch (error) {
    console.warn('[IndexedDB] Error guardando miniaturas', error)
  }
}
