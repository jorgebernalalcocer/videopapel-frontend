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

  // Si el padre actualiza value (por ejemplo tras refetch), sincroniza el select
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

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value ? Number(e.target.value) : ''
    setSelectedId(nextId)
    if (nextId === '' || !canRequest) return

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
      const saved = options.find(o => o.id === nextId)
      if (saved && onSaved) onSaved(saved)
    } catch (e: any) {
      setError(e.message || 'No se pudo guardar la orientación seleccionada.')
    } finally {
      setSaving(false)
    }
  }, [apiBase, accessToken, projectId, canRequest, options, onSaved])

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Orientación de impresión
      </label>

      <select
        value={selectedId}
        onChange={handleChange}
        disabled={!canRequest || loadingOptions || saving}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
      >
        <option value="">{loadingOptions ? 'Cargando…' : 'Cambiar orientación de impresión'}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt.description ? `${opt.description} (${opt.name})` : opt.name}
          </option>
        ))}
      </select>

      {saving && <p className="mt-1 text-xs text-gray-500">Guardando…</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
