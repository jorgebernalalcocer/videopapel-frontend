import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchCompanyGuestAccesses,
  createCompanyGuestAccess,
  deleteCompanyGuestAccess,
  fetchCompanyGuestAccessByToken,
  activateCompanyGuestAccess,
} from './companyGuestAccess'
import { apiFetch } from '@/lib/api'

vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }))
const apiFetchMock = vi.mocked(apiFetch)

const res = (ok: boolean, payload: unknown) => ({ ok, json: async () => payload }) as Response

beforeEach(() => apiFetchMock.mockReset())
afterEach(() => vi.restoreAllMocks())

describe('fetchCompanyGuestAccesses', () => {
  it('añade el query param company_id cuando se pasa', async () => {
    apiFetchMock.mockResolvedValue(res(true, { company_id: 3, results: [] }))
    await fetchCompanyGuestAccesses(3)
    expect(apiFetchMock).toHaveBeenCalledWith('/company-guest-accesses/?company_id=3')
  })

  it('omite el query param cuando no hay company_id', async () => {
    apiFetchMock.mockResolvedValue(res(true, { company_id: 0, results: [] }))
    await fetchCompanyGuestAccesses()
    expect(apiFetchMock).toHaveBeenCalledWith('/company-guest-accesses/')
  })

  it('lanza el detail del backend en error', async () => {
    apiFetchMock.mockResolvedValue(res(false, { detail: 'Sin permisos' }))
    await expect(fetchCompanyGuestAccesses()).rejects.toThrow('Sin permisos')
  })
})

describe('createCompanyGuestAccess', () => {
  it('hace POST con el cuerpo serializado', async () => {
    apiFetchMock.mockResolvedValue(res(true, { detail: 'ok', invitation: {} }))
    await createCompanyGuestAccess({ company_id: 1, client_name: 'Ana', duration: '60' })

    const [path, init] = apiFetchMock.mock.calls[0]
    expect(path).toBe('/company-guest-accesses/')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ company_id: 1, client_name: 'Ana', duration: '60' })
  })

  it('lanza mensaje por defecto si no hay detail', async () => {
    apiFetchMock.mockResolvedValue(res(false, {}))
    await expect(createCompanyGuestAccess({ duration: '60' })).rejects.toThrow('No se pudo crear la invitación.')
  })
})

describe('deleteCompanyGuestAccess', () => {
  it('hace DELETE sobre el id indicado', async () => {
    apiFetchMock.mockResolvedValue(res(true, { detail: 'borrado' }))
    await deleteCompanyGuestAccess(42)
    expect(apiFetchMock).toHaveBeenCalledWith('/company-guest-accesses/42/', { method: 'DELETE' })
  })
})

describe('fetchCompanyGuestAccessByToken (fetch crudo)', () => {
  it('valida un token y devuelve el payload', async () => {
    const payload = { is_valid: true, detail: 'ok', client_name: 'Ana' }
    const fetchMock = vi.fn().mockResolvedValue(res(true, payload))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchCompanyGuestAccessByToken('tk')
    expect(result).toEqual(payload)
    expect(fetchMock.mock.calls[0][0]).toContain('/company-guest-accesses/token/tk/')
  })

  it('lanza el detail cuando la validación falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(false, { detail: 'Token inválido' })))
    await expect(fetchCompanyGuestAccessByToken('tk')).rejects.toThrow('Token inválido')
  })
})

describe('activateCompanyGuestAccess (fetch crudo)', () => {
  it('hace POST al endpoint de activación y devuelve tokens', async () => {
    const payload = { detail: 'ok', access: 'a', refresh: 'r', user: { id: 1, email: 'g@x.com' } }
    const fetchMock = vi.fn().mockResolvedValue(res(true, payload))
    vi.stubGlobal('fetch', fetchMock)

    const result = await activateCompanyGuestAccess('tk')
    expect(result.access).toBe('a')
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toContain('/company-guest-accesses/token/tk/activate/')
    expect(opts.method).toBe('POST')
  })

  it('lanza el detail del backend en error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(false, { detail: 'Caducado' })))
    await expect(activateCompanyGuestAccess('tk')).rejects.toThrow('Caducado')
  })
})
