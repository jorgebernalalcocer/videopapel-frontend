'use client'

import { useCallback, useState } from 'react'
import { useAuth } from '@/store/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

type ExportOptions = {
  openWindow?: boolean
  shippingAddressId?: number | null
  cleanOutput?: boolean
  printStylePresetId?: number | null
}

export function useProjectPdfExport() {
  const accessToken = useAuth((s) => s.accessToken)
  const [exporting, setExporting] = useState(false)
  const [exportMode, setExportMode] = useState<'standard' | 'clean' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const exportPdf = useCallback(
    async (projectId: string, options?: ExportOptions) => {
      if (!accessToken) {
        const message = 'Debes iniciar sesión para generar el PDF.'
        setError(message)
        throw new Error(message)
      }

      setExporting(true)
      setExportMode(options?.cleanOutput ? 'clean' : 'standard')
      setError(null)

      try {
        const payload: Record<string, unknown> = {}
        if (options?.shippingAddressId != null) {
          payload.shipping_address_id = options.shippingAddressId
        }
        if (options?.cleanOutput) {
          payload.clean_output = true
        }
        if (options?.printStylePresetId != null) {
          payload.print_style_preset_id = options.printStylePresetId
        }
        const body = Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined

        const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` }
        if (body) {
          headers['Content-Type'] = 'application/json'
        }

        const res = await fetch(`${API_BASE}/projects/${projectId}/export-pdf/`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body,
        })

        const data = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error((data as any)?.detail || `Error ${res.status} al generar el PDF.`)
        }

        let url = (data as any)?.file
        if (!url) {
          throw new Error('La respuesta no contiene la URL del archivo.')
        }
        if (typeof url === 'string' && url.startsWith('/')) {
          url = `${API_BASE.replace(/\/+$/, '')}${url}`
        }

        if (options?.openWindow !== false) {
          window.open(url, '_blank', 'noopener,noreferrer')
        }

        return url as string
      } catch (err: any) {
        const message = err?.message || 'No se pudo generar el PDF.'
        setError(message)
        throw new Error(message)
      } finally {
        setExporting(false)
        setExportMode(null)
      }
    },
    [accessToken, API_BASE]
  )

  const clearError = useCallback(() => setError(null), [])

  return { exportPdf, exporting, exportMode, error, clearError }
}
