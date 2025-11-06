'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type PrintAspect = {
  id: number
  name: string
  slug: string
  description: string
}

type Props = {
  apiBase: string
  accessToken: string | null
  projectId: string
  value?: number | null
  onSaved?: (aspect: PrintAspect) => void
  className?: string
}

export default function AspectSelector({
  apiBase,
  accessToken,
  projectId,
  value,
  onSaved,
  className,
}: Props) {
  const [options, setOptions] = useState<PrintAspect[]>([])
  const [loading, setLoading] = useState(false)
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
        setLoading(true)
        setError(null)
        const res = await fetch(`${apiBase}/print-aspects/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `GET print-aspects ${res.status}`)
        }
        const data = (await res.json()) as PrintAspect[]
        if (!cancelled) setOptions(data)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'No se pudieron cargar las proporciones.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiBase, accessToken, canRequest])

  const handleChange = useCallback(
    async (nextId: number) => {
      if (!canRequest || nextId === selectedId) return
      const previous = selectedId
      setSelectedId(nextId)
      try {
        setSaving(true)
        setError(null)
        const res = await fetch(`${apiBase}/projects/${projectId}/print-aspect/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({ print_aspect_id: nextId }),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `PATCH ${res.status}`)
        }
        const saved = options.find((opt) => opt.id === nextId)
        if (saved && onSaved) onSaved(saved)
      } catch (err: any) {
        setError(err?.message || 'No se pudo guardar la proporción.')
        setSelectedId(previous)
      } finally {
        setSaving(false)
      }
    },
    [apiBase, accessToken, canRequest, options, onSaved, projectId, selectedId, value]
  )

  return (
    <div className={className}>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700">Proporción de impresión</legend>
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <label key={opt.id} className="inline-flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50">
              <input
                type="radio"
                name="project-aspect"
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
        {loading && <p className="text-xs text-gray-500">Cargando opciones…</p>}
        {saving && <p className="text-xs text-gray-500">Guardando…</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </fieldset>
    </div>
  )
}
