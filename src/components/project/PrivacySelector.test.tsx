import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PrivacySelector from './PrivacySelector'

const base = { apiBase: 'http://api.test', accessToken: 'tok', projectId: 'p1' }

const jsonRes = (data: unknown, ok = true) => ({
  ok, status: ok ? 200 : 400, json: async () => data, text: async () => JSON.stringify(data),
})

beforeEach(() => vi.restoreAllMocks())
afterEach(() => vi.restoreAllMocks())

describe('PrivacySelector', () => {
  it('marca "Privado" por defecto', () => {
    vi.stubGlobal('fetch', vi.fn())
    render(<PrivacySelector {...base} />)
    expect((screen.getByLabelText(/Privado/) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText(/Pública/) as HTMLInputElement).checked).toBe(false)
  })

  it('al pasar a público hace PATCH is_public:true y llama onSaved', async () => {
    const onSaved = vi.fn()
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({ id: 'p1' }))
    vi.stubGlobal('fetch', fetchMock)
    render(<PrivacySelector {...base} onSaved={onSaved} />)

    await userEvent.click(screen.getByLabelText(/Pública/))
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(true))

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/projects/p1/')
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ is_public: true })
  })

  it('no hace PATCH si el valor no cambia', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonRes({}))
    vi.stubGlobal('fetch', fetchMock)
    render(<PrivacySelector {...base} value={false} />)
    await userEvent.click(screen.getByLabelText(/Privado/)) // ya estaba en privado
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('revierte a privado si el PATCH falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonRes('Boom', false)))
    render(<PrivacySelector {...base} value={false} />)

    await userEvent.click(screen.getByLabelText(/Pública/))
    await waitFor(() => expect(screen.getByText(/Boom/)).toBeInTheDocument())
    expect((screen.getByLabelText(/Privado/) as HTMLInputElement).checked).toBe(true)
  })
})
