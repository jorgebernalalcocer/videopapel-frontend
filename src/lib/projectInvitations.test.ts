import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchProjectInvitationDetail, acceptProjectInvitation } from './projectInvitations'
import { apiFetch } from '@/lib/api'

// acceptProjectInvitation usa el apiFetch con Bearer/refresh de lib/api
vi.mock('@/lib/api', () => ({ apiFetch: vi.fn() }))
const apiFetchMock = vi.mocked(apiFetch)

afterEach(() => vi.restoreAllMocks())
beforeEach(() => apiFetchMock.mockReset())

describe('fetchProjectInvitationDetail', () => {
  it('devuelve el detalle de la invitación en caso de éxito', async () => {
    const detail = { token: 'abc', email: 'a@b.com', role: 'view', project: { id: '1', name: 'X' } }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => detail }))

    const result = await fetchProjectInvitationDetail('abc')
    expect(result).toEqual(detail)
  })

  it('apunta a la URL correcta con Accept y credenciales', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    await fetchProjectInvitationDetail('tok123')
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toContain('/project-invitations/tok123/')
    expect(opts.credentials).toBe('include')
    expect(opts.headers.Accept).toBe('application/json')
  })

  it('lanza un error legible si la respuesta no es ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    await expect(fetchProjectInvitationDetail('abc')).rejects.toThrow('No se pudo cargar la invitación.')
  })
})

describe('acceptProjectInvitation', () => {
  it('devuelve el payload en caso de éxito', async () => {
    const payload = { detail: 'ok', project_id: '9' }
    apiFetchMock.mockResolvedValue({ ok: true, json: async () => payload } as Response)

    const result = await acceptProjectInvitation('abc')
    expect(result).toEqual(payload)
    expect(apiFetchMock).toHaveBeenCalledWith('/project-invitations/abc/accept/', expect.objectContaining({ method: 'POST' }))
  })

  it('lanza con el detail del backend cuando la respuesta no es ok', async () => {
    apiFetchMock.mockResolvedValue({ ok: false, json: async () => ({ detail: 'Invitación caducada' }) } as Response)
    await expect(acceptProjectInvitation('abc')).rejects.toThrow('Invitación caducada')
  })

  it('usa un mensaje por defecto si el backend no da detail', async () => {
    apiFetchMock.mockResolvedValue({ ok: false, json: async () => ({}) } as Response)
    await expect(acceptProjectInvitation('abc')).rejects.toThrow('No se pudo aceptar la invitación.')
  })
})
