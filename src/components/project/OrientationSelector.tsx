'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'

type PrintOrientation = {
  id: number
  name: string
  description?: string | null
}

type Props = {
  apiBase: string
  accessToken: string | null
  projectId: string
  /** Id actualmente seleccionado (si lo tienes en el ProjectDetail) */
  value?: number | null
  /** Callback opcional tras guardar */
  onSaved?: (pq: PrintOrientation) => void
  className?: string
}

export default function OrientationSelector({
  apiBase,
  accessToken,
  projectId,
  value,
  onSaved,
  className,
}: Props) {
  const [options, setOptions] = useState<PrintOrientation[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | ''>(value ?? '')

  // Si el padre actualiza value (por ejemplo tras refetch), sincroniza la selección
  useEffect(() => {
    setSelectedId(value ?? '')
  }, [value])

  const canRequest = useMemo(() => Boolean(apiBase && accessToken && projectId), [apiBase, accessToken, projectId])

  // Cargar orientaciones
  useEffect(() => {
    if (!canRequest) return
    let cancelled = false
    ;(async () => {
      try {
        setError(null)
        setLoadingOptions(true)
        const res = await fetch(`${apiBase}/print-orientations/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`GET print-orientations ${res.status}`)
        const data = (await res.json()) as PrintOrientation[]
        if (!cancelled) setOptions(data)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'No se pudieron cargar las orientaciones de impresión.')
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
        const res = await fetch(`${apiBase}/projects/${projectId}/print-orientations/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({ print_orientation_id: nextId }),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `PATCH ${res.status}`)
        }
        const saved = options.find((o) => o.id === nextId)
        if (saved && onSaved) onSaved(saved)
      } catch (e: any) {
        setError(e.message || 'No se pudo guardar la orientación seleccionada.')
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
        <legend className="text-sm font-medium text-gray-700">Orientación de impresión</legend>
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <label key={opt.id} className="inline-flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50">
              <input
                type="radio"
                name="project-print-orientation"
                value={opt.id}
                checked={selectedId === opt.id}
                onChange={() => handleChange(opt.id)}
                disabled={!canRequest || saving}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="font-medium text-sm text-gray-900">{opt.name}</span>
                {opt.description && (
                  <span className="block text-xs text-gray-500 mt-0.5">{opt.description}</span>
                )}
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
