// src/lib/http.ts
import { API_URL } from '@/lib/env'
import { useLoading } from '@/store/loading'

const FAKE_LATENCY_MS =
  typeof window !== 'undefined'
    ? Number(process.env.NEXT_PUBLIC_FAKE_LATENCY_MS || 0) // p.ej. 800
    : 0

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
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
      throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`)
    }
    return res.json() as Promise<T>
  } finally {
    stop()
  }
}
