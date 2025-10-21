'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { API_URL } from '@/lib/env'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: { id: number; email: string } | null
  login: (tokens: { access: string; refresh: string; user?: any }) => void
  logout: () => Promise<void>
}

/**
 * Store global de autenticación (persistido en localStorage)
 */
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      // Login: guarda tokens y usuario
      login: ({ access, refresh, user }) =>
        set({ accessToken: access, refreshToken: refresh, user }),

      // Logout profesional: revoca el refresh token en backend y limpia estado local
      logout: async () => {
        try {
          const refreshToken = get().refreshToken
console.log('logout: refreshToken =', refreshToken)
const res = await fetch(`${API_URL}/token/blacklist/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh: refreshToken }),
})
console.log('logout: blacklist status', res.status)
          // Si hay refreshToken, lo mandamos al backend
          if (refreshToken) {
            await fetch(`${API_URL}/token/blacklist/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken }),
            })
          }
        } catch (err) {
          console.warn('Error al hacer logout en backend:', err)
        } finally {
          // Limpia el estado local y redirige
          set({ accessToken: null, refreshToken: null, user: null })
          if (typeof window !== 'undefined') {
            window.location.href = '/'
          }
        }
      },
    }),
    { name: 'videopapel-auth' } // Se guarda en localStorage
  )
)
