import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EffectSelector from './EffectSelector'

const OPTIONS = [
  { id: 1, name: 'Sepia', description: 'Cálido' },
  { id: 2, name: 'ByN', description: null },
]

const base = { apiBase: 'http://api.test', accessToken: 'tok', projectId: 'p1' }

const jsonRes = (data: unknown, ok = true) => ({
  ok, status: ok ? 200 : 400, json: async () => data, text: async () => JSON.stringify(data),
})
const routeFetch = (get: () => unknown, patch: () => unknown) =>
  vi.fn(async (_url: string, init?: RequestInit) => ((init?.method ?? 'GET') === 'PATCH' ? patch() : get()))

beforeEach(() => vi.restoreAllMocks())
afterEach(() => vi.restoreAllMocks())

describe('EffectSelector (usa <select>)', () => {
  it('carga las opciones en el desplegable', async () => {
    vi.stubGlobal('fetch', routeFetch(() => jsonRes(OPTIONS), () => jsonRes({})))
    render(<EffectSelector {...base} />)
    await waitFor(() => expect(screen.getByRole('option', { name: /Sepia/ })).toBeInTheDocument())
  })

  it('al elegir un efecto hace PATCH con effect_id y llama onSaved', async () => {
    const onSaved = vi.fn()
    const fetchMock = routeFetch(() => jsonRes(OPTIONS), () => jsonRes({}))
    vi.stubGlobal('fetch', fetchMock)
    render(<EffectSelector {...base} onSaved={onSaved} />)

    await waitFor(() => expect(screen.getByRole('option', { name: /Sepia/ })).toBeInTheDocument())
    await userEvent.selectOptions(screen.getByRole('combobox'), '1')

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(OPTIONS[0]))
    const patchCall = fetchMock.mock.calls.find(([, i]) => (i as RequestInit)?.method === 'PATCH')!
    expect(patchCall[0]).toContain('/projects/p1/print-effects/')
    expect(JSON.parse((patchCall[1] as RequestInit).body as string)).toEqual({ effect_id: 1 })
  })

  it('no hace peticiones sin accessToken', () => {
    const fetchMock = routeFetch(() => jsonRes(OPTIONS), () => jsonRes({}))
    vi.stubGlobal('fetch', fetchMock)
    render(<EffectSelector {...base} accessToken={null} />)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('muestra error si el PATCH falla', async () => {
    vi.stubGlobal('fetch', routeFetch(() => jsonRes(OPTIONS), () => jsonRes('Boom', false)))
    render(<EffectSelector {...base} />)
    await waitFor(() => expect(screen.getByRole('option', { name: /Sepia/ })).toBeInTheDocument())
    await userEvent.selectOptions(screen.getByRole('combobox'), '2')
    await waitFor(() => expect(screen.getByText(/Boom/)).toBeInTheDocument())
  })
})
