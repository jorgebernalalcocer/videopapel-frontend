// src/lib/http.ts
import { API_URL } from '@/lib/env'
import { useAuth } from '@/store/auth'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { accessToken } = useAuth.getState()  // ✅ corregido

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init?.headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}
