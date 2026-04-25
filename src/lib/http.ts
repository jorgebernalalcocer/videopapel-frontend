// src/lib/http.ts
import { API_URL } from '@/lib/env'
import { useLoading } from '@/store/loading'

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const FAKE_LATENCY_MS =
  typeof window !== 'undefined'
    ? Number(process.env.NEXT_PUBLIC_FAKE_LATENCY_MS || 0) // p.ej. 800
    : 0

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function buildErrorMessage(data: unknown, fallback: string) {
  const extractText = (value: unknown): string | null => {
    if (typeof value === 'string' && value.trim()) return value

    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = extractText(item)
        if (nested) return nested
      }
      return null
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>
      if (typeof record.message === 'string' && record.message.trim()) return record.message
      if (typeof record.detail === 'string' && record.detail.trim()) return record.detail
    }

    return null
  }

  if (!data || typeof data !== 'object') return fallback

  const record = data as Record<string, unknown>
  const detail = extractText(record.detail)
  if (detail) return detail

  const error = extractText(record.error)
  if (error) return error

  for (const value of Object.values(record)) {
    const message = extractText(value)
    if (message) return message
  }

  return fallback
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { start, stop } = useLoading.getState()
  start()
  try {
    const t0 = Date.now()

    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    })

    // aplica una latencia mínima (solo si está configurada)
    if (FAKE_LATENCY_MS > 0) {
      const elapsed = Date.now() - t0
      const remain = FAKE_LATENCY_MS - elapsed
      if (remain > 0) await sleep(remain)
    }

    if (!res.ok) {
      const txt = await res.text()
      let data: unknown = null

      if (txt) {
        try {
          data = JSON.parse(txt)
        } catch {
          data = txt
        }
      }

      const fallback = txt || res.statusText || `HTTP ${res.status}`
      throw new ApiError(buildErrorMessage(data, fallback), res.status, data)
    }
    return res.json() as Promise<T>
  } finally {
    stop()
  }
}
