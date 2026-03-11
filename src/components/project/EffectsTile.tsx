'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BaseTileModal, type TileOption } from '@/components/ui/BaseTileModal'
import ApplyEffect from '@/components/project/viewer/ApplyEffect'
import { cloudinaryFrameUrlFromVideoUrl } from '@/utils/cloudinary'

type PrintEffect = {
  id: number
  name: string
  description?: string | null
  preview_url?: string | null
}

export type EffectPreviewClip = {
  videoUrl: string
  frameTimeMs: number
  imageUrl?: string | null
}

type EffectsTileProps = {
  open: boolean
  apiBase: string
  accessToken: string | null
  projectId: string
  value?: number | null
  onClose: () => void
  onSaved?: (effect: PrintEffect | null) => void
  previewClip?: EffectPreviewClip | null
}

export default function EffectsTile({
  open,
  apiBase,
  accessToken,
  projectId,
  value,
  onClose,
  onSaved,
  previewClip,
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
      imageUrl: effect.preview_url ?? null,
      disabled: savingId !== null && savingId !== effect.id,
    }))
  }, [effects, savingId])

  const previewImage = useMemo(() => {
    if (!previewClip) return null
    if (previewClip.imageUrl) return previewClip.imageUrl
    try {
      return cloudinaryFrameUrlFromVideoUrl(previewClip.videoUrl, previewClip.frameTimeMs, 360)
    } catch {
      return null
    }
  }, [previewClip])

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

  const renderPreview = useCallback(
    (tile: TileOption) => (
      <ApplyEffect effectName={tile.label}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewImage ?? tile.imageUrl ?? undefined}
          alt={`Vista previa con ${tile.label}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            const img = event.currentTarget
            if (img.dataset.fallbackApplied === '1') return
            img.dataset.fallbackApplied = '1'
            if (tile.imageUrl) img.src = tile.imageUrl
          }}
        />
      </ApplyEffect>
    ),
    [previewImage],
  )

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
      renderPreview={renderPreview}
      modalProps={{ size: 'lg' }}
    />
  )
}
