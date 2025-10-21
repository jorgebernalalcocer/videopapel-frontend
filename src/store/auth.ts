'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type User = { id: number; email: string; is_active?: boolean } | null
type Tokens = { access: string; refresh: string; user?: User }

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: User
  isAuthenticated: boolean
  login: (tokens: Tokens) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      get isAuthenticated() {
        return !!get().accessToken
      },
      login: ({ access, refresh, user }) => {
        set({ accessToken: access, refreshToken: refresh, user: user ?? null })
      },
      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null })
        if (typeof window !== 'undefined') {
          window.location.href = '/' // redirect tras cerrar sesión
        }
      },
    }),
    { name: 'videopapel-auth' } // persiste en localStorage
  )
)
