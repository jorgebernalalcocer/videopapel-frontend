// src/store/auth.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { API_URL } from '@/lib/env'

type AuthUser = {
  id: number
  email: string
  username?: string | null
  phone?: string | null
  is_active?: boolean
  is_superuser?: boolean
  is_staff?: boolean
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  hasHydrated: boolean
  login: (tokens: { access: string; refresh: string; user?: AuthUser | null }) => void
  logout: () => Promise<void>
  setHasHydrated: (v: boolean) => void
  setTokens: (tokens: { access?: string | null; refresh?: string | null }) => void // 👈 NEW
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      // Guarda tokens y usuario al loguear
      login: ({ access, refresh, user }) =>
        set({ accessToken: access, refreshToken: refresh, user }),

      // 👇 NEW: actualizar tokens (p. ej., tras refresh)
      setTokens: ({ access, refresh }) =>
        set((state) => ({
          accessToken: access !== undefined ? access : state.accessToken,
          refreshToken: refresh !== undefined ? refresh : state.refreshToken,
        })),

      // Logout profesional
      logout: async () => {
        try {
          const refreshToken = get().refreshToken
          if (refreshToken) {
            await fetch(`${API_URL}/auth/token/blacklist/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh: refreshToken }),
            })
          }
        } catch (err) {
          console.warn('Error al hacer logout en backend:', err)
        } finally {
          set({ accessToken: null, refreshToken: null, user: null })
        }
      },
    }),
    {
      name: 'videopapel-auth',
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
