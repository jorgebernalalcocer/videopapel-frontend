'use client'

import { useCallback, useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BaseTileModal, type TileOption } from '@/components/ui/BaseTileModal'

type FrameTile = {
  id: number
  name: string
  slug: string
}

type IconsTilesProps = {
  open: boolean
  tiles: FrameTile[]
  selectedId?: number | null | ''
  onClose: () => void
  onSelect: (tile: FrameTile) => void
  color?: string
  filled?: boolean
}

const DEFAULT_COLOR = '#111827'

export default function IconsTiles({
  open,
  tiles,
  selectedId,
  onClose,
  onSelect,
  color = DEFAULT_COLOR,
  filled = true,
}: IconsTilesProps) {
  const normalizedSelectedId = typeof selectedId === 'number' ? selectedId : null

  const tileMap = useMemo(() => {
    const map = new Map<number, FrameTile>()
    tiles.forEach((tile) => map.set(tile.id, tile))
    return map
  }, [tiles])

  const options = useMemo<TileOption[]>(() => {
    return tiles.map((tile) => ({
      id: tile.id,
      label: tile.name,
      description: tile.slug,
      meta: { slug: tile.slug },
    }))
  }, [tiles])

  const resolveIcon = useCallback((slug?: string | null): LucideIcon | null => {
    if (!slug) return null
    const normalized = slug.trim()
    if (!normalized) return null
    const inferred = inferShapeName(normalized)
    const pool = LucideIcons as Record<string, LucideIcon | undefined>
    const pascal = toPascalCase(normalized)
    const candidates = Array.from(
      new Set(
        [
          normalized,
          normalized.toLowerCase(),
          normalized.toUpperCase(),
          pascal,
          inferred,
          inferred?.toLowerCase(),
        ].filter(Boolean) as string[],
      ),
    )
    for (const key of candidates) {
      const icon = pool[key]
      if (icon) return icon
    }
    return null
  }, [])

  const renderPreview = useCallback(
    (option: TileOption) => {
      const slug = (option.meta?.slug as string | undefined) ?? option.description ?? option.label
      const IconComponent = resolveIcon(slug)
      if (!IconComponent) {
        return (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
            {option.label}
          </div>
        )
      }
      return (
        <IconComponent
          size={48}
          strokeWidth={filled ? 1.4 : 1.8}
          color={color}
          fill={filled ? color : 'none'}
          className="mx-auto my-auto"
        />
      )
    },
    [color, filled, resolveIcon],
  )

  const handleSelect = useCallback(
    (option: TileOption) => {
      const tileId = typeof option.id === 'number' ? option.id : Number(option.id)
      if (!Number.isFinite(tileId)) return
      const tile = tileMap.get(tileId)
      if (tile) {
        onSelect(tile)
      }
    },
    [onSelect, tileMap],
  )

  return (
    <BaseTileModal
      open={open}
      onClose={onClose}
      title="Seleccionar icono del mosaico"
      description="Explora los iconos disponibles y elige el que mejor se adapte al marco."
      tiles={options}
      selectedId={normalizedSelectedId}
      onSelect={handleSelect}
      renderPreview={renderPreview}
      modalProps={{ size: 'lg' }}
    />
  )
}

function toPascalCase(value: string): string {
  return value
    .replace(/[-_\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
    .replace(/^[a-z]/, (ch) => ch.toUpperCase())
}

function inferShapeName(value: string): string | undefined {
  const key = value.trim().toLowerCase()
  if (!key) return undefined
  if (key.includes('heart') || key.includes('corazon')) return 'Heart'
  if (
    key.includes('star') ||
    key.includes('estrella') ||
    key.includes('spark') ||
    key.includes('sparkle') ||
    key.includes('sol')
  )
    return 'Star'
  if (
    key.includes('flower') ||
    key.includes('flor') ||
    key.includes('clover') ||
    key.includes('trebol') ||
    key.includes('petal')
  )
    return 'Flower'
  if (key.includes('hex')) return 'Hexagon'
  if (key.includes('diamond') || key.includes('rombo') || key.includes('shield') || key.includes('badge'))
    return 'Diamond'
  if (key.includes('triangle') || key.includes('bolt') || key.includes('rayo') || key.includes('lightning'))
    return 'Triangle'
  if (key.includes('circle') || key.includes('circulo')) return 'Circle'
  if (key.includes('square') || key.includes('cuadrado')) return 'Square'
  return undefined
}
