'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { PrintStylePresetDraftPayload } from '@/components/profile/PrintStylePresetModal'

type OpenPresetPdfButtonProps = {
  apiBase: string
  accessToken: string | null
  payload: PrintStylePresetDraftPayload
  fitMode: 'exact' | 'production'
  disabled?: boolean
}

export default function OpenPresetPdfButton({
  apiBase,
  accessToken,
  payload,
  fitMode,
  disabled = false,
}: OpenPresetPdfButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!accessToken) {
      toast.error('Debes iniciar sesión para abrir el PDF de muestra.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/print-style-presets/preview-pdf/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...payload,
          selected_format: Number(payload.selected_format),
          imposed_on_format: Number(payload.imposed_on_format),
          columns: payload.columns ? Number(payload.columns) : null,
          rows: payload.rows ? Number(payload.rows) : null,
          fit_mode: fitMode,
        }),
      })

      if (!res.ok) {
        const detail = await res.text()
        throw new Error(detail || `Error ${res.status}`)
      }

      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      window.open(objectUrl, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch (err: any) {
      const message = err?.message || 'No se pudo generar el PDF de muestra.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={disabled || loading}
      className="mt-4 w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-60"
    >
      {loading ? 'Generando PDF de muestra…' : 'Abrir PDF de muestra'}
    </button>
  )
}
