import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrientationSelector from './OrientationSelector'

const OPTIONS = [
  { id: 1, name: 'Vertical', description: 'De pie' },
  { id: 2, name: 'Horizontal', description: 'Apaisado' },
]

const baseProps = {
  apiBase: 'http://api.test',
  accessToken: 'tok',
  projectId: 'p1',
}

// Enruta el fetch según método + URL
function mockFetch(handlers: { get?: () => any; patch?: () => any }) {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    if ((init?.method ?? 'GET') === 'PATCH') return handlers.patch?.()
    return handlers.get?.()
  })
}

const jsonRes = (data: unknown, ok = true) => ({
  ok,
  status: ok ? 200 : 400,
  json: async () => data,
  text: async () => JSON.stringify(data),
})

beforeEach(() => vi.restoreAllMocks())
afterEach(() => vi.restoreAllMocks())

describe('OrientationSelector', () => {
  it('carga y renderiza las opciones de orientación', async () => {
    vi.stubGlobal('fetch', mockFetch({ get: () => jsonRes(OPTIONS) }))
    render(<OrientationSelector {...baseProps} />)

    expect(await screen.findByLabelText(/Vertical/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Horizontal/)).toBeInTheDocument()
  })

  it('no hace peticiones si falta el accessToken', () => {
    const fetchMock = mockFetch({ get: () => jsonRes(OPTIONS) })
    vi.stubGlobal('fetch', fetchMock)
    render(<OrientationSelector {...baseProps} accessToken={null} />)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('al seleccionar una opción hace PATCH y llama a onSaved', async () => {
    const onSaved = vi.fn()
    const fetchMock = mockFetch({
      get: () => jsonRes(OPTIONS),
      patch: () => jsonRes({ id: 'p1', print_orientation: 2 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<OrientationSelector {...baseProps} value={1} onSaved={onSaved} />)

    const horizontal = await screen.findByLabelText(/Horizontal/)
    await userEvent.click(horizontal)

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(OPTIONS[1]))

    // La segunda llamada es el PATCH con el id elegido
    const patchCall = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PATCH')
    expect(patchCall).toBeTruthy()
    expect(JSON.parse((patchCall![1] as RequestInit).body as string)).toEqual({ print_orientation_id: 2 })
  })

  it('revierte la selección y muestra error si el PATCH falla', async () => {
    const fetchMock = mockFetch({
      get: () => jsonRes(OPTIONS),
      patch: () => jsonRes('Boom', false),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<OrientationSelector {...baseProps} value={1} />)

    const vertical = await screen.findByLabelText(/Vertical/) as HTMLInputElement
    const horizontal = await screen.findByLabelText(/Horizontal/) as HTMLInputElement

    await userEvent.click(horizontal)

    // Tras fallar, vuelve a la selección previa (Vertical) y muestra el error
    await waitFor(() => expect(screen.getByText(/Boom/)).toBeInTheDocument())
    expect(vertical.checked).toBe(true)
    expect(horizontal.checked).toBe(false)
  })
})
