import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useAuth } from './auth'

// Estado inicial del store para resetear entre tests (es un singleton)
const initialState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  hasHydrated: false,
}

const user = {
  id: 1,
  email: 'test@videopapel.com',
  account_type: 'individual' as const,
}

beforeEach(() => {
  // Reseteamos solo los datos, conservando las acciones del store
  useAuth.setState(initialState)
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useAuth store', () => {
  it('empieza sin sesión y sin hidratar', () => {
    const s = useAuth.getState()
    expect(s.accessToken).toBeNull()
    expect(s.refreshToken).toBeNull()
    expect(s.user).toBeNull()
    expect(s.hasHydrated).toBe(false)
  })

  it('login guarda tokens y usuario', () => {
    useAuth.getState().login({ access: 'acc', refresh: 'ref', user })

    const s = useAuth.getState()
    expect(s.accessToken).toBe('acc')
    expect(s.refreshToken).toBe('ref')
    expect(s.user).toEqual(user)
  })

  it('setTokens actualiza solo lo que se le pasa (undefined conserva el valor previo)', () => {
    useAuth.getState().login({ access: 'acc', refresh: 'ref', user })

    // refresh sin definir → no debe tocar el refreshToken existente
    useAuth.getState().setTokens({ access: 'nuevo-acc' })

    const s = useAuth.getState()
    expect(s.accessToken).toBe('nuevo-acc')
    expect(s.refreshToken).toBe('ref')
  })

  it('setTokens con null borra explícitamente el token', () => {
    useAuth.getState().login({ access: 'acc', refresh: 'ref', user })

    useAuth.getState().setTokens({ access: null })

    expect(useAuth.getState().accessToken).toBeNull()
    expect(useAuth.getState().refreshToken).toBe('ref')
  })

  it('setGuestSession establece una sesión de invitado', () => {
    const guest = { ...user, account_type: 'company_guest' as const, actor_type: 'company_guest' as const }
    useAuth.getState().setGuestSession({ access: 'g-acc', refresh: 'g-ref', user: guest })

    const s = useAuth.getState()
    expect(s.accessToken).toBe('g-acc')
    expect(s.user?.account_type).toBe('company_guest')
  })

  it('clearSession borra tokens y usuario', () => {
    useAuth.getState().login({ access: 'acc', refresh: 'ref', user })
    useAuth.getState().clearSession()

    const s = useAuth.getState()
    expect(s.accessToken).toBeNull()
    expect(s.refreshToken).toBeNull()
    expect(s.user).toBeNull()
  })

  it('setHasHydrated marca la hidratación', () => {
    useAuth.getState().setHasHydrated(true)
    expect(useAuth.getState().hasHydrated).toBe(true)
  })

  describe('logout', () => {
    it('llama al endpoint de blacklist con el refresh token y limpia la sesión', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true })
      vi.stubGlobal('fetch', fetchMock)

      useAuth.getState().login({ access: 'acc', refresh: 'ref', user })
      await useAuth.getState().logout()

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, opts] = fetchMock.mock.calls[0]
      expect(url).toContain('/auth/token/blacklist/')
      expect(opts.method).toBe('POST')
      expect(JSON.parse(opts.body)).toEqual({ refresh: 'ref' })

      // La sesión queda limpia
      expect(useAuth.getState().accessToken).toBeNull()
      expect(useAuth.getState().user).toBeNull()
    })

    it('sin refresh token no llama al backend pero igual limpia la sesión', async () => {
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)

      useAuth.setState({ accessToken: 'acc', refreshToken: null, user })
      await useAuth.getState().logout()

      expect(fetchMock).not.toHaveBeenCalled()
      expect(useAuth.getState().accessToken).toBeNull()
    })

    it('si el backend falla, la sesión se limpia igualmente (finally)', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('network'))
      vi.stubGlobal('fetch', fetchMock)
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      useAuth.getState().login({ access: 'acc', refresh: 'ref', user })
      await useAuth.getState().logout()

      expect(useAuth.getState().accessToken).toBeNull()
      expect(useAuth.getState().user).toBeNull()
    })
  })
})
