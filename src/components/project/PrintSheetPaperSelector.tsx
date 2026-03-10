'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type PrintSheetPaper = {
  id: number
  label: string
  weight: number
  finishing: string
}

type Props = {
  apiBase: string
  accessToken: string | null
  projectId: string
  value?: number | null
  onSaved?: (paper: PrintSheetPaper | null) => void
  className?: string
}

export default function PrintSheetPaperSelector({
  apiBase,
  accessToken,
  projectId,
  value,
  onSaved,
  className,
}: Props) {
  const [options, setOptions] = useState<PrintSheetPaper[]>([])
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
        const res = await fetch(`${apiBase}/print-sheet-papers/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (!res.ok) throw new Error(`GET print-sheet-papers ${res.status}`)
        const data = (await res.json()) as PrintSheetPaper[]
        if (!cancelled) setOptions(data)
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'No se pudieron cargar los papeles.')
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    })()
    return () => { cancelled = true }
  }, [apiBase, accessToken, canRequest, projectId])

  const handleChange = useCallback(
    async (nextId: number) => {
      if (!canRequest || nextId === selectedId) return
      const previous = selectedId
      setSelectedId(nextId)

      try {
        setSaving(true)
        setError(null)
        const res = await fetch(`${apiBase}/projects/${projectId}/print-sheet-paper/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({ print_sheet_paper_id: nextId }),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `PATCH ${res.status}`)
        }
        const saved = options.find((opt) => opt.id === nextId) ?? null
        if (onSaved) onSaved(saved)
      } catch (e: any) {
        setError(e.message || 'No se pudo guardar el papel de impresión.')
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
        <legend className="text-sm font-medium text-gray-700">Papel de impresión</legend>
        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <label key={option.id} className="inline-flex items-start gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50">
              <input
                type="radio"
                name="project-print-sheet-paper"
                value={option.id}
                checked={selectedId === option.id}
                onChange={() => handleChange(option.id)}
                disabled={!canRequest || saving}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="font-medium text-sm text-gray-900">{option.label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {option.weight} g/m2 — {option.finishing}
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
