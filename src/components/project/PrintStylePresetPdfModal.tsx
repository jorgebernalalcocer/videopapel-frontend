'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import PrintStylePresetModal, {
  type PrintStylePresetResponse,
} from '@/components/profile/PrintStylePresetModal'

type PrintStylePresetPdfModalProps = {
  open: boolean
  onClose: () => void
  apiBase: string
  accessToken: string | null
  projectPrintSizeLabel?: string | null
  onConfirm: (presetId: number) => Promise<void> | void
  generating?: boolean
}

export default function PrintStylePresetPdfModal({
  open,
  onClose,
  apiBase,
  accessToken,
  projectPrintSizeLabel,
  onConfirm,
  generating = false,
}: PrintStylePresetPdfModalProps) {
  const [presets, setPresets] = useState<PrintStylePresetResponse[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingPreset, setCreatingPreset] = useState(false)

  useEffect(() => {
    if (!open || !accessToken) return

    let ignore = false

    const fetchPresets = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${apiBase}/print-style-presets/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (!res.ok) {
          const detail = await res.text()
          throw new Error(detail || `Error ${res.status}`)
        }
        const payload = await res.json()
        const list: PrintStylePresetResponse[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
          ? payload.results
          : []

        if (ignore) return

        setPresets(list)
        setSelectedPresetId((current) => {
          if (current && list.some((preset) => preset.id === current)) return current
          return list.find((preset) => preset.is_default)?.id ?? list[0]?.id ?? null
        })
      } catch (err: any) {
        if (ignore) return
        setError(err?.message || 'No se pudieron cargar las configuraciones de impresión.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    void fetchPresets()

    return () => {
      ignore = true
    }
  }, [accessToken, apiBase, open])

  const handleClose = () => {
    if (generating) return
    onClose()
  }

  const handleConfirm = async () => {
    if (!selectedPresetId) {
      toast.error('Selecciona una configuración de impresión.')
      return
    }
    await onConfirm(selectedPresetId)
  }

  const handlePresetCreated = (preset: PrintStylePresetResponse) => {
    setPresets((current) => {
      const next = [preset, ...current.filter((item) => item.id !== preset.id)]
      return next.sort((a, b) => {
        if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
        return a.name.localeCompare(b.name)
      })
    })
    setSelectedPresetId(preset.id)
    setCreatingPreset(false)
  }

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="Exportación avanzada"
        description={
          projectPrintSizeLabel
            ? `Selecciona una configuración avanzada para exportar el proyecto en ${projectPrintSizeLabel}.`
            : 'Selecciona una configuración avanzada de impresión para generar el PDF.'
        }
        size="lg"
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-gray-500">
              Se usarán los tamaños y reglas definidos en el preset seleccionado.
            </div>
            <button
              type="button"
              onClick={() => setCreatingPreset(true)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Añadir nueva configuración
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Cargando configuraciones…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : presets.length === 0 ? (
            <p className="text-sm text-gray-500">
              Todavía no tienes configuraciones avanzadas guardadas.
            </p>
          ) : (
            <ul className="space-y-3">
              {presets.map((preset) => (
                <li
                  key={preset.id}
                  className={`rounded-xl border px-4 py-3 ${
                    selectedPresetId === preset.id ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="radio"
                      name="print-style-preset"
                      checked={selectedPresetId === preset.id}
                      onChange={() => setSelectedPresetId(preset.id)}
                      className="mt-1 h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="space-y-1 text-sm text-gray-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{preset.name}</span>
                        {preset.is_default && (
                          <span className="text-xs font-semibold uppercase tracking-wide text-green-700">
                            Predeterminado
                          </span>
                        )}
                      </div>
                      <p>
                        {preset.selected_format_label} en {preset.imposed_on_format_label}
                      </p>
                      <p className="text-gray-500">
                        Mosaico: {preset.mosaic_mode} · Rotación: {preset.rotation_mode} · Escala máx.: {preset.max_scale_percent}%
                      </p>
                      {preset.notes && <p className="text-gray-500">Notas: {preset.notes}</p>}
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
              disabled={generating}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              disabled={generating || loading || !selectedPresetId}
            >
              {generating ? 'Generando PDF avanzado…' : 'Generar pdf avanzado'}
            </button>
          </div>
        </div>
      </Modal>

      <PrintStylePresetModal
        open={creatingPreset}
        onClose={() => setCreatingPreset(false)}
        apiBase={apiBase}
        accessToken={accessToken}
        onSaved={handlePresetCreated}
      />
    </>
  )
}
