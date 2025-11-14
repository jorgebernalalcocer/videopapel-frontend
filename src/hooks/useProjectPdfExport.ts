'use client'

import { useCallback, useState } from 'react'
import { useAuth } from '@/store/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

type ExportOptions = {
  openWindow?: boolean
}

export function useProjectPdfExport() {
  const accessToken = useAuth((s) => s.accessToken)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportPdf = useCallback(
    async (projectId: string, options?: ExportOptions) => {
      if (!accessToken) {
        const message = 'Debes iniciar sesión para generar el PDF.'
        setError(message)
        throw new Error(message)
      }

      setExporting(true)
      setError(null)

      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}/export-pdf/`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
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
      }
    },
    [accessToken, API_BASE]
  )

  const clearError = useCallback(() => setError(null), [])

  return { exportPdf, exporting, error, clearError }
}
