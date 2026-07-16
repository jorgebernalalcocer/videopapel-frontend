import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiFetch, ApiError } from './http'
import { useLoading } from '@/store/loading'

// Helpers para construir respuestas fetch falsas
function okJson(data: unknown) {
  return { ok: true, status: 200, statusText: 'OK', json: async () => data, text: async () => JSON.stringify(data) }
}
function errWith(status: number, body: string, statusText = '') {
  return { ok: false, status, statusText, text: async () => body, json: async () => JSON.parse(body) }
}

beforeEach(() => {
  useLoading.setState({ pending: 0 })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('apiFetch', () => {
  it('devuelve el JSON parseado en caso de éxito', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ id: 1, name: 'foo' })))
    const data = await apiFetch<{ id: number; name: string }>('/things/1/')
    expect(data).toEqual({ id: 1, name: 'foo' })
  })

  it('gestiona el contador de loading (sube y baja a 0)', async () => {
    let pendingDuranteFetch = -1
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      pendingDuranteFetch = useLoading.getState().pending
      return okJson({})
    }))

    await apiFetch('/x/')
    expect(pendingDuranteFetch).toBe(1)
    expect(useLoading.getState().pending).toBe(0)
  })

  it('baja el contador de loading incluso si la petición falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errWith(500, '')))
    await expect(apiFetch('/x/')).rejects.toBeInstanceOf(ApiError)
    expect(useLoading.getState().pending).toBe(0)
  })

  describe('normalización de errores (estilo DRF)', () => {
    it('usa "detail" cuando está presente', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errWith(404, JSON.stringify({ detail: 'No encontrado' }))))
      await expect(apiFetch('/x/')).rejects.toThrow('No encontrado')
    })

    it('usa "error" cuando no hay "detail"', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errWith(400, JSON.stringify({ error: 'Algo falló' }))))
      await expect(apiFetch('/x/')).rejects.toThrow('Algo falló')
    })

    it('usa el primer error de campo (array) para errores de validación', async () => {
      const body = JSON.stringify({ email: ['Este email ya está registrado'] })
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errWith(400, body)))
      await expect(apiFetch('/x/')).rejects.toThrow('Este email ya está registrado')
    })

    it('cae al texto crudo cuando el cuerpo no es JSON', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errWith(502, 'Bad Gateway texto plano')))
      await expect(apiFetch('/x/')).rejects.toThrow('Bad Gateway texto plano')
    })

    it('cae al statusText cuando el cuerpo está vacío', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errWith(503, '', 'Service Unavailable')))
      await expect(apiFetch('/x/')).rejects.toThrow('Service Unavailable')
    })

    it('expone status y data en el ApiError', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(errWith(422, JSON.stringify({ detail: 'X' }))))
      try {
        await apiFetch('/x/')
        expect.unreachable('debería haber lanzado')
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError)
        expect((e as ApiError).status).toBe(422)
        expect((e as ApiError).data).toEqual({ detail: 'X' })
      }
    })
  })
})
