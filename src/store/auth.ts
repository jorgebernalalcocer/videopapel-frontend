// src/store/auth.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { API_URL } from '@/lib/env'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: { id: number; email: string } | null
  hasHydrated: boolean
  login: (tokens: { access: string; refresh: string; user?: any }) => void
  logout: () => Promise<void>
  setHasHydrated: (v: boolean) => void
}

/**
 * Store global de autenticación (persistido en localStorage)
 * - skipHydration: evita parpadeos al montar (no lee localStorage en SSR)
 * - hasHydrated: flag para renderizar el menú solo cuando ya hidrató
 */
export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),

      // Login: guarda tokens y usuario
      login: ({ access, refresh, user }) =>
        set({ accessToken: access, refreshToken: refresh, user }),

      // Logout profesional: revoca el refresh token en backend y limpia estado local
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
      name: 'videopapel-auth', // Se guarda en localStorage
      skipHydration: true,     // 👈 evita leer durante el render inicial (fuente del parpadeo)
      onRehydrateStorage: () => (state) => {
        // se llama cuando ha terminado de hidratar desde localStorage
        state?.setHasHydrated(true)
      },
    }
  )
)
