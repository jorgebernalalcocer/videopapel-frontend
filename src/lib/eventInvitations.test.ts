import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchEventInvitationDetail, acceptEventInvitation } from './eventInvitations'
import { apiFetch } from '@/lib/api'

// acceptEventInvitation usa el apiFetch con Bearer/refresh de lib/api
vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }))
const apiFetchMock = vi.mocked(apiFetch)

beforeEach(() => apiFetchMock.mockReset())
afterEach(() => vi.restoreAllMocks())

describe('fetchEventInvitationDetail', () => {
  it('devuelve el detalle de la invitación en caso de éxito', async () => {
    const detail = { token: 'abc', email: 'a@b.com', role: 'view', event: { id: '1', name: 'Boda' } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => detail }))

    expect(await fetchEventInvitationDetail('abc')).toEqual(detail)
  })

  it('apunta a la URL de event-invitations con Accept y credenciales', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    await fetchEventInvitationDetail('tok123')
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toContain('/event-invitations/tok123/')
    expect(opts.credentials).toBe('include')
    expect(opts.headers.Accept).toBe('application/json')
  })

  it('lanza un error legible si la respuesta no es ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    await expect(fetchEventInvitationDetail('abc')).rejects.toThrow('No se pudo cargar la invitación.')
  })
})

describe('acceptEventInvitation', () => {
  it('devuelve el payload en caso de éxito', async () => {
    const payload = { detail: 'ok', event_id: '9' }
    apiFetchMock.mockResolvedValue({ ok: true, json: async () => payload } as Response)

    expect(await acceptEventInvitation('abc')).toEqual(payload)
    expect(apiFetchMock).toHaveBeenCalledWith('/event-invitations/abc/accept/', expect.objectContaining({ method: 'POST' }))
  })

  it('lanza con el detail del backend cuando la respuesta no es ok', async () => {
    apiFetchMock.mockResolvedValue({ ok: false, json: async () => ({ detail: 'Invitación caducada' }) } as Response)
    await expect(acceptEventInvitation('abc')).rejects.toThrow('Invitación caducada')
  })

  it('usa un mensaje por defecto si el backend no da detail', async () => {
    apiFetchMock.mockResolvedValue({ ok: false, json: async () => ({}) } as Response)
    await expect(acceptEventInvitation('abc')).rejects.toThrow('No se pudo aceptar la invitación.')
  })
})
