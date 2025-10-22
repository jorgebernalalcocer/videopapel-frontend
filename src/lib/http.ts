// src/lib/http.ts
import { API_URL } from '@/lib/env'
import { useLoading } from '@/store/loading'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { start, stop } = useLoading.getState()
  start()
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
    })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`)
    }
    return res.json() as Promise<T>
  } finally {
    stop()
  }
}
