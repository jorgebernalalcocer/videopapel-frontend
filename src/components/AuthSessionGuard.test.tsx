import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import AuthSessionGuard from './AuthSessionGuard'
import { useAuth } from '@/store/auth'

// next/navigation con refs mutables (hoisted para poder usarlos en la factory)
const nav = vi.hoisted(() => ({ replace: vi.fn(), pathname: '/' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => nav.pathname,
}))

// Response falso mínimo: el guard solo usa .status y .clone().json()
const fakeRes = (status: number, payload: unknown) => ({
  status,
  clone: () => ({ json: async () => payload }),
})

beforeEach(() => {
  nav.replace.mockReset()
  nav.pathname = '/'
  window.history.replaceState({}, '', '/')
  useAuth.setState({ accessToken: null, refreshToken: null, user: null, hasHydrated: true })
})
afterEach(() => vi.restoreAllMocks())

describe('AuthSessionGuard — protección de rutas', () => {
  it('redirige a login si no hay token en una ruta protegida', () => {
    vi.stubGlobal('fetch', vi.fn())
    nav.pathname = '/projects/1'
    useAuth.setState({ hasHydrated: true, accessToken: null })

    render(<AuthSessionGuard />)
    expect(nav.replace).toHaveBeenCalledWith('/login?session_expired=1')
  })

  it('no redirige en una ruta pública', () => {
    vi.stubGlobal('fetch', vi.fn())
    nav.pathname = '/login'
    useAuth.setState({ hasHydrated: true, accessToken: null })

    render(<AuthSessionGuard />)
    expect(nav.replace).not.toHaveBeenCalled()
  })

  it('no redirige si hay token en una ruta protegida', () => {
    vi.stubGlobal('fetch', vi.fn())
    nav.pathname = '/projects/1'
    useAuth.setState({ hasHydrated: true, accessToken: 'tok' })

    render(<AuthSessionGuard />)
    expect(nav.replace).not.toHaveBeenCalled()
  })

  it('no hace nada hasta que el store ha hidratado', () => {
    vi.stubGlobal('fetch', vi.fn())
    nav.pathname = '/projects/1'
    useAuth.setState({ hasHydrated: false, accessToken: null })

    render(<AuthSessionGuard />)
    expect(nav.replace).not.toHaveBeenCalled()
  })
})

describe('AuthSessionGuard — intercepción de window.fetch', () => {
  it('un 401 con token_not_valid limpia la sesión y redirige en ruta protegida', async () => {
    window.history.replaceState({}, '', '/projects/1')
    nav.pathname = '/projects/1'
    useAuth.setState({ hasHydrated: true, accessToken: 'tok' }) // con token → el efecto de ruta no redirige

    const originalFetch = vi.fn().mockResolvedValue(fakeRes(401, { code: 'token_not_valid' }))
    vi.stubGlobal('fetch', originalFetch)

    render(<AuthSessionGuard />)
    await act(async () => { await window.fetch('/api/x') })

    expect(useAuth.getState().accessToken).toBeNull()
    expect(nav.replace).toHaveBeenCalledWith('/login?session_expired=1')
  })

  it('un 401 que NO es de token inválido no cierra la sesión', async () => {
    nav.pathname = '/projects/1'
    useAuth.setState({ hasHydrated: true, accessToken: 'tok' })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes(401, { detail: 'Otro error' })))

    render(<AuthSessionGuard />)
    let res: any
    await act(async () => { res = await window.fetch('/api/x') })

    expect(useAuth.getState().accessToken).toBe('tok')
    expect(res.status).toBe(401)
  })

  it('deja pasar las respuestas que no son 401', async () => {
    useAuth.setState({ hasHydrated: true, accessToken: 'tok' })
    const originalFetch = vi.fn().mockResolvedValue(fakeRes(200, { ok: true }))
    vi.stubGlobal('fetch', originalFetch)

    render(<AuthSessionGuard />)
    let res: any
    await act(async () => { res = await window.fetch('/api/x') })

    expect(res.status).toBe(200)
    expect(originalFetch).toHaveBeenCalled()
    expect(useAuth.getState().accessToken).toBe('tok')
  })

  it('restaura el window.fetch original al desmontar', async () => {
    useAuth.setState({ hasHydrated: true, accessToken: 'tok' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fakeRes(200, {})))

    const { unmount } = render(<AuthSessionGuard />)
    const patched = window.fetch // el fetch parcheado por el guard
    unmount()
    expect(window.fetch).not.toBe(patched)
  })
})
