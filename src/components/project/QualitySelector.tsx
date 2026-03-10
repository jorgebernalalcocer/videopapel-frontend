'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'

type PrintQuality = {
  id: number
  name: string
  dpi?: number
  points_per_inch?: number
}

type Props = {
  apiBase: string
  accessToken: string | null
  projectId: string
  /** Id actualmente seleccionado (si lo tienes en el ProjectDetail) */
  value?: number | null
  /** Callback opcional tras guardar */
  onSaved?: (pq: PrintQuality) => void
  className?: string
}

export default function QualitySelector({
  apiBase,
  accessToken,
  projectId,
  value,
  onSaved,
  className,
}: Props) {
  const [options, setOptions] = useState<PrintQuality[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | ''>(value ?? '')

  // Si el padre actualiza value (por ejemplo tras refetch), sincroniza la selección
  useEffect(() => {
    setSelectedId(value ?? '')
  }, [value])

  const canRequest = useMemo(() => Boolean(apiBase && accessToken && projectId), [apiBase, accessToken, projectId])

  // Cargar calidades
  useEffect(() => {
    if (!canRequest) return
    let cancelled = false
    ;(async () => {
      try {
        setError(null)
        setLoadingOptions(true)
        const res = await fetch(`${apiBase}/print-qualities/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`GET print-qualities ${res.status}`)
        const data = (await res.json()) as PrintQuality[]
        if (!cancelled) setOptions(data)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'No se pudieron cargar las calidades de impresión.')
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    })()
    return () => { cancelled = true }
  }, [apiBase, accessToken, projectId, canRequest])

  const handleChange = useCallback(
    async (nextId: number) => {
      if (!canRequest || nextId === selectedId) return
      const previous = selectedId
      setSelectedId(nextId)

      try {
        setSaving(true)
        setError(null)
        const res = await fetch(`${apiBase}/projects/${projectId}/print-quality/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({ print_quality_id: nextId }),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `PATCH ${res.status}`)
        }
        const saved = options.find((o) => o.id === nextId)
        if (saved && onSaved) onSaved(saved)
      } catch (e: any) {
        setError(e.message || 'No se pudo guardar la calidad seleccionada.')
        setSelectedId(previous)
      } finally {
        setSaving(false)
      }
    },
    [apiBase, accessToken, projectId, canRequest, options, onSaved, selectedId]
  )

  return (
    <div className={className}>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700">Calidad de impresión</legend>
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <label key={opt.id} className="inline-flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50">
              <input
                type="radio"
                name="project-print-quality"
                value={opt.id}
                checked={selectedId === opt.id}
                onChange={() => handleChange(opt.id)}
                disabled={!canRequest || saving}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="font-medium text-sm text-gray-900">{opt.name}</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {(opt.dpi ?? opt.points_per_inch) ?? '—'} DPI
                </span>
              </span>
            </label>
          ))}
        </div>
        {loadingOptions && <p className="text-xs text-gray-500">Cargando opciones…</p>}
        {saving && <p className="text-xs text-gray-500">Guardando…</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </fieldset>
    </div>
  )
}
