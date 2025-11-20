'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type PrintBindingOption = {
  id: number
  name: string
  description?: string | null
}

type Props = {
  apiBase: string
  accessToken: string | null
  projectId: string
  value?: number | null
  onSaved?: (binding: PrintBindingOption | null) => void
  className?: string
}

export default function BindingSelector({
  apiBase,
  accessToken,
  projectId,
  value,
  onSaved,
  className,
}: Props) {
  const [options, setOptions] = useState<PrintBindingOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | ''>(value ?? '')

  useEffect(() => {
    setSelectedId(value ?? '')
  }, [value])

  const canRequest = useMemo(
    () => Boolean(apiBase && accessToken && projectId),
    [apiBase, accessToken, projectId],
  )

  useEffect(() => {
    if (!canRequest) return
    let cancelled = false
    ;(async () => {
      try {
        setError(null)
        setLoadingOptions(true)
        const res = await fetch(`${apiBase}/print-bindings/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (!res.ok) {
          const detail = await res.text()
          throw new Error(detail || `GET print-bindings ${res.status}`)
        }
        const data = (await res.json()) as PrintBindingOption[]
        if (!cancelled) setOptions(data)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'No se pudieron cargar las encuadernaciones disponibles.')
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiBase, accessToken, projectId, canRequest])

  const handleChange = useCallback(
    async (event: React.ChangeEvent<HTMLSelectElement>) => {
      const raw = event.target.value
      const nextId = raw === '' ? '' : Number(raw)
      setSelectedId(nextId)
      if (!canRequest) return
      try {
        setSaving(true)
        setError(null)
        const res = await fetch(`${apiBase}/projects/${projectId}/print-binding/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            print_binding_id: nextId === '' ? null : nextId,
          }),
        })
        if (!res.ok) {
          const detail = await res.text()
          throw new Error(detail || `PATCH print-binding ${res.status}`)
        }
        const saved = nextId === '' ? null : options.find(opt => opt.id === nextId) ?? null
        if (onSaved) onSaved(saved)
      } catch (e: any) {
        setError(e.message || 'No se pudo guardar la encuadernación seleccionada.')
      } finally {
        setSaving(false)
      }
    },
    [apiBase, accessToken, projectId, canRequest, options, onSaved],
  )

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Encuadernación</label>

      <select
        value={selectedId}
        onChange={handleChange}
        disabled={!canRequest || loadingOptions || saving}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
      >
        <option value="">
          {loadingOptions ? 'Cargando…' : 'Sin encuadernación / predeterminada'}
        </option>
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
