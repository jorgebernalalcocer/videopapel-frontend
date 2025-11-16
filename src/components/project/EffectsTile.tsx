'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BaseTileModal, type TileOption } from '@/components/ui/BaseTileModal'

type PrintEffect = {
  id: number
  name: string
  description?: string | null
  preview_url?: string | null
}

type EffectsTileProps = {
  open: boolean
  apiBase: string
  accessToken: string | null
  projectId: string
  value?: number | null
  onClose: () => void
  onSaved?: (effect: PrintEffect | null) => void
}

const PREVIEW_PLACEHOLDER = '/samples/sample-1.jpg'

export default function EffectsTile({
  open,
  apiBase,
  accessToken,
  projectId,
  value,
  onClose,
  onSaved,
}: EffectsTileProps) {
  const [effects, setEffects] = useState<PrintEffect[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(value ?? null)

  useEffect(() => {
    setSelectedId(value ?? null)
  }, [value])

  useEffect(() => {
    if (!open) return
    if (!apiBase || !accessToken) {
      setEffects([])
      setError('Necesitas iniciar sesión para ver los efectos disponibles.')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await fetch(`${apiBase}/print-effects/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Error ${res.status}`)
        }
        const data = (await res.json()) as PrintEffect[]
        if (!cancelled) {
          setEffects(Array.isArray(data) ? data : [])
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'No se pudieron cargar los efectos disponibles.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, apiBase, accessToken])

  const options = useMemo((): TileOption[] => {
    return effects.map((effect) => ({
      id: effect.id,
      label: effect.name,
      description: effect.description ?? undefined,
      imageUrl: effect.preview_url ?? PREVIEW_PLACEHOLDER,
      disabled: savingId !== null && savingId !== effect.id,
    }))
  }, [effects, savingId])

  const handleSelect = useCallback(async (option: TileOption) => {
    if (!accessToken) return
    const nextId = typeof option.id === 'number' ? option.id : Number(option.id)
    if (!Number.isFinite(nextId)) return
    setSavingId(nextId)
    setError(null)
    try {
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
        throw new Error(text || `Error ${res.status}`)
      }
      setSelectedId(nextId)
      const saved = effects.find((effect) => effect.id === nextId) ?? null
      onSaved?.(saved)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'No se pudo aplicar el efecto seleccionado.')
    } finally {
      setSavingId(null)
    }
  }, [accessToken, apiBase, projectId, effects, onClose, onSaved])

  return (
    <BaseTileModal
      open={open}
      onClose={() => {
        if (!savingId) onClose()
      }}
      title="Seleccionar efecto de impresión"
      description="Explora los efectos disponibles y aplica el que prefieras al proyecto."
      tiles={options}
      selectedId={selectedId}
      loading={loading}
      error={error}
      onSelect={handleSelect}
      modalProps={{ size: 'lg' }}
    />
  )
}
