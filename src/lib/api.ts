// src/lib/api.ts
import { useAuth } from '@/store/auth'

export async function apiFetch(input: string, init: RequestInit = {}) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE!
  const { accessToken, refreshToken, setTokens } = useAuth.getState()

  const makeInit = (token?: string): RequestInit => {
    const headers: HeadersInit = {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    return {
      ...init,
      headers,
      credentials: 'include' as RequestCredentials, // 👈 tipado correcto
    }
  }

  // 1ª llamada con access token actual
  let res = await fetch(`${API_BASE}${input}`, makeInit(accessToken || undefined))
  if (res.status !== 401 || !refreshToken) return res

  // Si 401 y tenemos refresh, intentamos refrescar
  const r = await fetch(`${API_BASE}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' } as HeadersInit,
    credentials: 'include' as RequestCredentials,
    body: JSON.stringify({ refresh: refreshToken }),
  })

  if (!r.ok) return res

  const data = await r.json()
  setTokens({ access: data.access })

  // Reintentamos con el nuevo access token
  res = await fetch(`${API_BASE}${input}`, makeInit(data.access))
  return res
}
