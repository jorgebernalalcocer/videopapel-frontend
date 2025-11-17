'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BaseTileModal, type TileOption } from '@/components/ui/BaseTileModal'

export type TypographyOption = {
  slug: string
  display_name: string
  description?: string | null
  font_family_css?: string | null
}

type Props = {
  open: boolean
  apiBase: string
  accessToken: string | null
  selectedSlug?: string | null
  onClose: () => void
  onSelect: (option: TypographyOption | null) => void
}

export default function TypographyTiles({
  open,
  apiBase,
  accessToken,
  selectedSlug,
  onClose,
  onSelect,
}: Props) {
  const [options, setOptions] = useState<TypographyOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (!apiBase || !accessToken) {
      setOptions([])
      setError('Debes iniciar sesión para ver las tipografías disponibles.')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await fetch(`${apiBase}/typographies/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: 'include',
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Error ${res.status}`)
        }
        const data = (await res.json()) as TypographyOption[]
        if (!cancelled) {
          setOptions(Array.isArray(data) ? data : [])
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'No se pudieron cargar las tipografías.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, apiBase, accessToken])

  const tileOptions = useMemo((): TileOption[] => {
    const baseOptions: TileOption[] = [
      {
        id: '__none',
        label: 'Sin tipografía',
        description: 'Usar tipografía por defecto',
      },
      ...options.map((opt) => ({
        id: opt.slug,
        label: opt.display_name,
        description: opt.description ?? undefined,
        meta: {
          fontFamily: opt.font_family_css,
        },
      })),
    ]
    return baseOptions
  }, [options])

  const renderPreview = useCallback((option: TileOption) => {
    // const text = option.id === '__none' ? 'Texto por defecto' : 'El veloz murciélago hindú comía feliz cardillo y kiwi.'
    const text = option.id === '__none' ? 'Texto por defecto' : 'El veloz murciélago hindú comía feliz cardillo y kiwi.'

    const fontFamily =
      (option.meta?.fontFamily as string | undefined) ||
      (option.id !== '__none' ? option.label : undefined)
    return (
      <div
        className="h-full w-full flex items-center justify-center text-center text-sm px-2"
        style={{ fontFamily: fontFamily || 'inherit' }}
      >
        {text}
      </div>
    )
  }, [])

  const handleSelect = useCallback(
    (tile: TileOption) => {
      if (tile.id === '__none') {
        onSelect(null)
      } else {
        const option = options.find((opt) => opt.slug === tile.id)
        if (option) onSelect(option)
      }
    },
    [onSelect, options],
  )

  const selectedId = selectedSlug == null ? undefined : selectedSlug === '' ? '__none' : selectedSlug

  return (
    <BaseTileModal
      open={open}
      onClose={onClose}
      title="Seleccionar tipografía"
      description="Previsualiza y elige la tipografía que se aplicará al texto."
      tiles={tileOptions}
      selectedId={selectedId}
      loading={loading}
      error={error}
      onSelect={handleSelect}
      renderPreview={renderPreview}
      modalProps={{ size: 'lg' }}
    />
  )
}
