import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectPdfExport } from './useProjectPdfExport'
import { useAuth } from '@/store/auth'

const jsonRes = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => data,
})

beforeEach(() => {
  useAuth.setState({ accessToken: 'tok', refreshToken: null, user: null, hasHydrated: true })
  vi.stubGlobal('open', vi.fn())
})
afterEach(() => vi.restoreAllMocks())

describe('useProjectPdfExport', () => {
  it('sin token: lanza, marca error y no llama a fetch', async () => {
    useAuth.setState({ accessToken: null })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useProjectPdfExport())
    await act(async () => {
      await expect(result.current.exportPdf('p1')).rejects.toThrow(
        'Debes iniciar sesión para generar el PDF.'
      )
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Debes iniciar sesión para generar el PDF.')
  })

  it('export estándar: POST sin body, devuelve la url y abre ventana', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ file: 'https://cdn/x.pdf' }))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useProjectPdfExport())
    let url: string | undefined
    await act(async () => { url = await result.current.exportPdf('p1') })

    expect(url).toBe('https://cdn/x.pdf')
    const [reqUrl, init] = fetchMock.mock.calls[0]
    expect(reqUrl).toContain('/projects/p1/export-pdf/')
    expect(init.method).toBe('POST')
    expect(init.body).toBeUndefined()
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(window.open).toHaveBeenCalledWith('https://cdn/x.pdf', '_blank', 'noopener,noreferrer')
    expect(result.current.exporting).toBe(false)
    expect(result.current.exportMode).toBeNull()
  })

  it('cleanOutput: envía clean_output en el payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ file: 'https://cdn/x.pdf' }))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useProjectPdfExport())
    await act(async () => { await result.current.exportPdf('p1', { cleanOutput: true }) })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toEqual({ clean_output: true })
  })

  it('incluye shipping_address_id y print_style_preset_id cuando se pasan', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ file: 'https://cdn/x.pdf' }))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useProjectPdfExport())
    await act(async () => {
      await result.current.exportPdf('p1', { shippingAddressId: 7, printStylePresetId: 3 })
    })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toEqual({ shipping_address_id: 7, print_style_preset_id: 3 })
  })

  it('prefija las urls relativas con API_BASE', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ file: '/media/f.pdf' })))

    const { result } = renderHook(() => useProjectPdfExport())
    let url: string | undefined
    await act(async () => { url = await result.current.exportPdf('p1') })

    expect(url).toBe('http://localhost:8000/media/f.pdf')
  })

  it('openWindow=false: no abre ventana pero devuelve la url', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ file: 'https://cdn/x.pdf' })))

    const { result } = renderHook(() => useProjectPdfExport())
    let url: string | undefined
    await act(async () => { url = await result.current.exportPdf('p1', { openWindow: false }) })

    expect(url).toBe('https://cdn/x.pdf')
    expect(window.open).not.toHaveBeenCalled()
  })

  it('respuesta no-ok: lanza con el detail del backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({ detail: 'Proyecto vacío' }, false, 400)))

    const { result } = renderHook(() => useProjectPdfExport())
    await act(async () => {
      await expect(result.current.exportPdf('p1')).rejects.toThrow('Proyecto vacío')
    })
    expect(result.current.error).toBe('Proyecto vacío')
    expect(result.current.exporting).toBe(false)
  })

  it('respuesta sin file: lanza error específico', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes({})))

    const { result } = renderHook(() => useProjectPdfExport())
    await act(async () => {
      await expect(result.current.exportPdf('p1')).rejects.toThrow(
        'La respuesta no contiene la URL del archivo.'
      )
    })
  })

  it('clearError limpia el mensaje de error', async () => {
    useAuth.setState({ accessToken: null })
    vi.stubGlobal('fetch', vi.fn())
    const { result } = renderHook(() => useProjectPdfExport())

    await act(async () => {
      await expect(result.current.exportPdf('p1')).rejects.toThrow()
    })
    expect(result.current.error).not.toBeNull()

    act(() => result.current.clearError())
    expect(result.current.error).toBeNull()
  })
})
