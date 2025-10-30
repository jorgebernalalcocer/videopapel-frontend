'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type PrintEffect = {
  id: number
  name: string
  description?: string | null
}

type Props = {
  apiBase: string
  accessToken: string | null
  projectId: string
  value?: number | null
  onSaved?: (effect: PrintEffect | null) => void
  className?: string
}

export default function EffectSelector({
  apiBase,
  accessToken,
  projectId,
  value,
  onSaved,
  className,
}: Props) {
  const [options, setOptions] = useState<PrintEffect[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | ''>(value ?? '')

  useEffect(() => {
    setSelectedId(value ?? '')
  }, [value])

  const canRequest = useMemo(
    () => Boolean(apiBase && accessToken && projectId),
    [apiBase, accessToken, projectId]
  )

  useEffect(() => {
    if (!canRequest) return
    let cancelled = false
    ;(async () => {
      try {
        setError(null)
        setLoadingOptions(true)
        const res = await fetch(`${apiBase}/print-effects/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`GET print-effects ${res.status}`)
        const data = (await res.json()) as PrintEffect[]
        if (!cancelled) setOptions(data)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'No se pudieron cargar los efectos disponibles.')
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
      const res = await fetch(`${apiBase}/projects/${projectId}/print-effects/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ effect_id: nextId }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `PATCH ${res.status}`)
      }
      const saved = options.find(opt => opt.id === nextId) ?? null
      if (onSaved) onSaved(saved)
    } catch (e: any) {
      setError(e.message || 'No se pudo guardar el efecto seleccionado.')
    } finally {
      setSaving(false)
    }
  }, [apiBase, accessToken, projectId, canRequest, options, onSaved])

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Efecto de impresión
      </label>

      <select
        value={selectedId}
        onChange={handleChange}
        disabled={!canRequest || loadingOptions || saving}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
      >
        <option value="">{loadingOptions ? 'Cargando…' : 'Selecciona un efecto'}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
            {opt.description ? ` — ${opt.description}` : ''}
          </option>
        ))}
      </select>

      {saving && <p className="mt-1 text-xs text-gray-500">Guardando…</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
