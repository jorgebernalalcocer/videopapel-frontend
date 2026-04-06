'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/store/auth'

const PUBLIC_PATH_PREFIXES = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/reset-password-confirm',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/invitations',
]

const PROTECTED_PATH_PREFIXES = [
  '/projects',
  '/events',
  '/clips',
  '/cart',
  '/summary',
  '/shipping',
  '/orders',
  '/profile',
  '/rectification-invoice',
]

function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function isTokenInvalidPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') return false

  const data = payload as {
    code?: string
    detail?: string
    messages?: Array<{ token_type?: string; message?: string }>
  }

  if (data.code === 'token_not_valid') return true
  if (typeof data.detail === 'string' && data.detail.includes('Given token not valid for any token type')) return true

  return Array.isArray(data.messages)
    && data.messages.some(
      (message) =>
        message?.token_type === 'access'
        && typeof message.message === 'string'
        && message.message.toLowerCase().includes('token is invalid or expired')
    )
}

export default function AuthSessionGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const hasHydrated = useAuth((state) => state.hasHydrated)
  const accessToken = useAuth((state) => state.accessToken)
  const clearSession = useAuth((state) => state.clearSession)

  useEffect(() => {
    if (!hasHydrated || typeof window === 'undefined') return

    const originalFetch = window.fetch.bind(window)

    const forceLogout = async (response: Response) => {
      let payload: unknown = null

      try {
        payload = await response.clone().json()
      } catch {
        payload = null
      }

      if (!isTokenInvalidPayload(payload)) return response

      clearSession()
      useAuth.persist?.clearStorage?.()

      if (isProtectedPath(window.location.pathname)) {
        router.replace('/login?session_expired=1')
      }

      return response
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init)

      if (response.status === 401) {
        return forceLogout(response)
      }

      return response
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [clearSession, hasHydrated, router])

  useEffect(() => {
    if (!hasHydrated || !pathname) return

    if (!accessToken && isProtectedPath(pathname) && !isPublicPath(pathname)) {
      router.replace('/login?session_expired=1')
    }
  }, [accessToken, hasHydrated, pathname, router])

  return null
}
