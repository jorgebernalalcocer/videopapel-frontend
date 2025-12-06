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

  const handleChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value ? Number(e.target.value) : ''
    setSelectedId(nextId)
    if (!canRequest) return

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
        body: JSON.stringify({ print_sheet_paper_id: nextId === '' ? null : nextId }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `PATCH ${res.status}`)
      }
      const saved = nextId === '' ? null : options.find((opt) => opt.id === nextId) ?? null
      if (onSaved) onSaved(saved)
    } catch (e: any) {
      setError(e.message || 'No se pudo guardar el papel de impresión.')
    } finally {
      setSaving(false)
    }
  }, [apiBase, accessToken, projectId, canRequest, options, onSaved])

  return (
    <div className={className}>
      <label htmlFor="print-sheet-paper-select" className="block text-sm font-medium text-gray-700 mb-1">
        Papel de impresión
      </label>
      <select
        id="print-sheet-paper-select"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        value={selectedId}
        onChange={handleChange}
        disabled={!canRequest || loadingOptions || saving}
      >
        <option value="">{loadingOptions ? 'Cargando…' : 'Elegir papel'}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label} — {option.weight} g/m2 — {option.finishing}
          </option>
        ))}
      </select>
      {saving && <p className="mt-1 text-xs text-gray-500">Guardando…</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
