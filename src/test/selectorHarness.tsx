// Harness compartido para los *Selector basados en radios que siguen el mismo
// patrón: GET de opciones al montar + PATCH al elegir una + revert en error.
// No es un archivo de test (no casa con el glob *.test); lo importan los tests.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentType } from 'react'

const jsonRes = (data: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => data,
  text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
})

function routeFetch(handlers: { get: () => unknown; patch: () => unknown }) {
  return vi.fn(async (_url: string, init?: RequestInit) =>
    (init?.method ?? 'GET') === 'PATCH' ? handlers.patch() : handlers.get()
  )
}

type RadioSelectorConfig = {
  name: string
  Component: ComponentType<any>
  options: Array<Record<string, any>>
  /** Propiedad de la opción que se muestra como etiqueta (name/label) */
  labelKey: string
  /** Fragmento de la URL del GET de opciones */
  getUrlIncludes: string
  /** Fragmento de la URL del PATCH */
  patchUrlIncludes: string
  /** Nombre del campo enviado en el body del PATCH */
  patchField: string
}

export function runRadioSelectorSuite(cfg: RadioSelectorConfig) {
  const { name, Component, options, labelKey, getUrlIncludes, patchUrlIncludes, patchField } = cfg
  const base = { apiBase: 'http://api.test', accessToken: 'tok' as string | null, projectId: 'p1' }
  const labelRe = (opt: Record<string, any>) => new RegExp(String(opt[labelKey]))

  describe(name, () => {
    beforeEach(() => vi.restoreAllMocks())
    afterEach(() => vi.restoreAllMocks())

    it('carga y renderiza las opciones', async () => {
      vi.stubGlobal('fetch', routeFetch({ get: () => jsonRes(options), patch: () => jsonRes({}) }))
      render(<Component {...base} />)
      expect(await screen.findByLabelText(labelRe(options[0]))).toBeInTheDocument()
      expect(screen.getByLabelText(labelRe(options[1]))).toBeInTheDocument()
    })

    it('pega al endpoint GET correcto', async () => {
      const fetchMock = routeFetch({ get: () => jsonRes(options), patch: () => jsonRes({}) })
      vi.stubGlobal('fetch', fetchMock)
      render(<Component {...base} />)
      await screen.findByLabelText(labelRe(options[0]))
      expect(fetchMock.mock.calls[0][0]).toContain(getUrlIncludes)
    })

    it('no hace peticiones sin accessToken', () => {
      const fetchMock = routeFetch({ get: () => jsonRes(options), patch: () => jsonRes({}) })
      vi.stubGlobal('fetch', fetchMock)
      render(<Component {...base} accessToken={null} />)
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('al seleccionar una opción hace PATCH con el id y llama onSaved', async () => {
      const onSaved = vi.fn()
      const fetchMock = routeFetch({ get: () => jsonRes(options), patch: () => jsonRes({ id: 'p1' }) })
      vi.stubGlobal('fetch', fetchMock)
      render(<Component {...base} value={options[0].id} onSaved={onSaved} />)

      await userEvent.click(await screen.findByLabelText(labelRe(options[1])))
      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(options[1]))

      const patchCall = fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PATCH')!
      expect(patchCall[0]).toContain(patchUrlIncludes)
      expect(JSON.parse((patchCall[1] as RequestInit).body as string)).toEqual({ [patchField]: options[1].id })
    })

    it('revierte la selección si el PATCH falla', async () => {
      const fetchMock = routeFetch({ get: () => jsonRes(options), patch: () => jsonRes('Boom', false, 400) })
      vi.stubGlobal('fetch', fetchMock)
      render(<Component {...base} value={options[0].id} />)

      const first = (await screen.findByLabelText(labelRe(options[0]))) as HTMLInputElement
      const second = (await screen.findByLabelText(labelRe(options[1]))) as HTMLInputElement
      await userEvent.click(second)

      await waitFor(() => expect(screen.getByText(/Boom/)).toBeInTheDocument())
      expect(first.checked).toBe(true)
      expect(second.checked).toBe(false)
    })
  })
}
