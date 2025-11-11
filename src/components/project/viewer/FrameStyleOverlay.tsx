'use client'

import type { CSSProperties } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FrameSettingClient, FramePosition } from '@/types/frame'

type Props = {
  setting?: FrameSettingClient | null
  dimensions: { width: number; height: number }
  printWidthMm?: number | null
  printHeightMm?: number | null
  printQualityPpi?: number | null
}

const POSITION_STYLES: Record<FramePosition, CSSProperties> = {
  top: { top: 0, left: 0, right: 0 },
  bottom: { bottom: 0, left: 0, right: 0 },
  left: { top: 0, bottom: 0, left: 0 },
  right: { top: 0, bottom: 0, right: 0 },
}

const DEFAULT_COLOR = 'rgba(0,0,0,0.9)'
const FALLBACK_PPI = 300

export default function FrameStyleOverlay({
  setting,
  dimensions,
  printWidthMm,
  printHeightMm,
  printQualityPpi,
}: Props) {
  if (!setting || !setting.positions || !setting.positions.length) return null
  if (!dimensions.width || !dimensions.height) return null

  const uniquePositions = Array.from(new Set(setting.positions)) as FramePosition[]
  if (!uniquePositions.length) return null

  const ppi = Math.max(1, printQualityPpi || FALLBACK_PPI)
  const thicknessPct =
    setting.thickness_pct != null ? Math.max(0, Number(setting.thickness_pct)) : null
  const rawThicknessPx = setting.thickness_px || 8

  const color = normalizeColor(setting.color_hex, setting.frame?.name)
  const style = (setting.frame?.style || 'fill').toLowerCase()
  const tileSlug = setting.tile?.slug ?? null
  const tileFilled = setting.tile_filled !== false
  const referenceDimensionPx = dimensions.height
  const baseThicknessPx = computeThicknessPx({
    thicknessPct,
    thicknessPx: rawThicknessPx,
    ppi,
    dimensionMm: printHeightMm,
    dimensionPx: referenceDimensionPx,
  })
  const thicknessTopBottom = baseThicknessPx
  const thicknessLeftRight = baseThicknessPx

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: '50%',
        top: '50%',
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {uniquePositions.map((position) =>
        renderSegment(
          style,
          position,
          color,
          {
            thicknessTopBottom,
            thicknessLeftRight,
            dimensions,
          },
          tileSlug,
          tileFilled
        )
      )}
    </div>
  )
}

function renderSegment(
  style: string,
  position: FramePosition,
  color: string,
  dims: {
    thicknessTopBottom: number
    thicknessLeftRight: number
    dimensions: { width: number; height: number }
  },
  tileSlug?: string | null,
  tileFilled?: boolean
) {
  const thickness =
    position === 'top' || position === 'bottom'
      ? dims.thicknessTopBottom
      : dims.thicknessLeftRight

  // --- ESTILO 'LINE' (CORRECTO) ---
  if (style === 'line') {
    const isHorizontal = position === 'top' || position === 'bottom'
    const lineThickness = Math.max(2, thickness / 3) 
    
    return (
      <div
        key={`${style}-${position}`}
        className="absolute"
        style={{
          ...POSITION_STYLES[position], 
          backgroundColor: color,
          ...(isHorizontal
            ? {
                height: `${lineThickness}px`,
                [position]: `calc(${thickness / 2}px - ${lineThickness / 2}px)`, 
              }
            : {
                width: `${lineThickness}px`,
                [position]: `calc(${thickness / 2}px - ${lineThickness / 2}px)`,
              }),
        }}
      />
    )
  }

// --- ESTILO 'TILE' (MIMÉTICO A DOTS, SOLO CAMBIA EL ELEMENTO) ---
if (style === 'tile') {
  const { width, height } = dims.dimensions
  const isHorizontal = position === 'top' || position === 'bottom'
  const isFilled = tileFilled !== false

  const IconComponent = resolveTileIcon(tileSlug)
  if (!IconComponent) {
    const baseShapeStyles = isFilled
      ? { backgroundColor: color }
      : { backgroundColor: 'transparent', border: `2px solid ${color}` }
    return (
      <div
        key={`fill-${position}`}
        className="absolute"
        style={{
          ...POSITION_STYLES[position],
          ...baseShapeStyles,
          ...(isHorizontal ? { height: `${thickness}px` } : { width: `${thickness}px` }),
        }}
      />
    )
  }

  // === COPIA EXACTA DE DOTS ===
  const dotSize = Math.max(4, thickness / 2)     // igual que dots
  const radius = dotSize / 2
  const reduction = dotSize                      // igual que dots

  const effectiveLength = (isHorizontal ? width : height) - (reduction * 2)
  if (effectiveLength < dotSize) return null

  const spacingFactor = 3.5                      // igual que dots
  const step = dotSize * spacingFactor
  const numDots = Math.floor(effectiveLength / step)
  if (numDots < 2) return null

  const centerSpacing = effectiveLength / (numDots - 1)

  const thicknessCenterOffset = `calc(${thickness / 2}px - ${dotSize / 2}px)`
  const containerStyles: CSSProperties = {
    position: 'absolute',
    [isHorizontal ? 'left' : 'top']: `${reduction}px`,
    [isHorizontal ? 'right' : 'bottom']: `${reduction}px`,
    [isHorizontal ? 'height' : 'width']: `${dotSize}px`,
    [position]: thicknessCenterOffset,
    display: 'block',
    color, // Lucide usa currentColor en stroke → se tiñe correctamente
  }
  if (isHorizontal) {
    containerStyles.width = 'auto'
  } else {
    containerStyles.height = 'auto'
  }

  return (
    <div key={`tile-${position}`} className="absolute" style={containerStyles}>
      {Array.from({ length: numDots }).map((_, idx) => {
        const centerPos = idx * centerSpacing
        const offsetPos = centerPos - radius

        return (
          <IconComponent
            key={`${position}-tile-${idx}`}
            size={dotSize}
            strokeWidth={isFilled ? 1.4 : 1.8}
            color={color}
            fill={isFilled ? color : 'none'}
            style={{
              display: 'block',
              position: 'absolute',
              ...(isHorizontal
                ? { left: `${offsetPos}px`, top: 0 }
                : { top: `${offsetPos}px`, left: 0 }),
            }}
          />
        )
      })}
    </div>
  )
}


  // --- ESTILO 'DOTS' (EL CÓDIGO QUE FUNCIONA) ---
  if (style === 'dots') {
    const { width, height } = dims.dimensions
    const isHorizontal = position === 'top' || position === 'bottom'
    
    const dotSize = Math.max(4, thickness / 2)
    const radius = dotSize / 2
    
    const reduction = dotSize 

    const effectiveLength = (isHorizontal ? width : height) - (reduction * 2) 

    if (effectiveLength < dotSize) return null 

    const spacingFactor = 3.5 
    const step = dotSize * spacingFactor 
    const numDots = Math.floor(effectiveLength / step)
    
    if (numDots < 2) return null 
    
    const centerSpacing = effectiveLength / (numDots - 1) 
    
    const dotsArray = Array.from({ length: numDots })

    const thicknessCenterOffset = `calc(${thickness / 2}px - ${dotSize / 2}px)`
    
    let containerStyles: CSSProperties = {
        position: 'absolute',
        [isHorizontal ? 'left' : 'top']: `${reduction}px`,
        [isHorizontal ? 'right' : 'bottom']: `${reduction}px`,

        [isHorizontal ? 'height' : 'width']: `${dotSize}px`,
        [position]: thicknessCenterOffset, 
        
        display: 'block', 
    }
    
    if (isHorizontal) {
        containerStyles.width = `auto`
    } else {
        containerStyles.height = `auto`
    }

    return (
      <div
        key={`${style}-${position}`}
        className="absolute"
        style={containerStyles} 
      >
        {dotsArray.map((_, idx) => {
          const centerPos = idx * centerSpacing
          
          const offsetPos = centerPos - radius

          return (
            <span
              key={`${position}-dot-${idx}`}
              style={{
                display: 'block',
                position: 'absolute', 
                width: `${dotSize}px`,
                height: `${dotSize}px`,
                borderRadius: '50%',
                backgroundColor: color,
                opacity: 0.85,
                ...(isHorizontal 
                    ? { left: `${offsetPos}px`, top: 0 } 
                    : { top: `${offsetPos}px`, left: 0 } 
                ),
              }}
            />
          )
        })}
      </div>
    )
  }

  // --- ESTILO 'FILL' (FALLBACK ORIGINAL) ---
  return (
    <div
      key={`${style}-${position}`}
      className="absolute"
      style={{
        ...POSITION_STYLES[position],
        backgroundColor: color,
        ...(position === 'top' || position === 'bottom'
          ? { height: `${thickness}px` }
          : { width: `${thickness}px` }),
      }}
    />
  )
}

// --- Funciones auxiliares (Sin cambios) ---

function resolveTileIcon(slug?: string | null): LucideIcon | null {
  if (!slug) return null
  const normalized = slug.trim()
  if (!normalized) return null
  const pascal = toPascalCase(normalized)
  const candidates = Array.from(
    new Set([normalized, normalized.toLowerCase(), normalized.toUpperCase(), pascal])
  )
  const pool = LucideIcons as Record<string, LucideIcon | undefined>
  for (const key of candidates) {
    const icon = pool[key]
    if (icon) return icon
  }
  return null
}

function toPascalCase(value: string): string {
  return value
    .replace(/[-_\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ''))
    .replace(/^[a-z]/, (ch) => ch.toUpperCase())
}

function computeThicknessPx({
  thicknessPct,
  thicknessPx,
  ppi,
  dimensionMm,
  dimensionPx,
}: {
  thicknessPct: number | null
  thicknessPx: number
  ppi: number
  dimensionMm?: number | null
  dimensionPx: number
}) {
  const minDimensionPx = Math.max(1, dimensionPx)
  if (thicknessPct && thicknessPct > 0) {
    const scaled = thicknessPct * minDimensionPx
    return Math.max(2, Math.min(scaled, minDimensionPx / 2))
  }
  if (!dimensionMm || dimensionMm <= 0) {
    const fallback = Math.max(2, Math.min(thicknessPx, minDimensionPx / 2))
    return fallback
  }
  const thicknessInches = thicknessPx / ppi
  const thicknessMm = thicknessInches * 25.4
  const mmPerPixel = dimensionMm / minDimensionPx
  const displayThickness = thicknessMm / mmPerPixel
  const clamped = Math.max(2, Math.min(displayThickness, minDimensionPx / 2))
  return clamped
}

function normalizeColor(value?: string | null, fallbackName?: string | null): string {
  if (value) return value
  if (!fallbackName) return DEFAULT_COLOR
  const name = fallbackName.toLowerCase()
  if (name.includes('negro') || name.includes('black') || name.includes('cine')) {
    return '#000000'
  }
  return DEFAULT_COLOR
}
