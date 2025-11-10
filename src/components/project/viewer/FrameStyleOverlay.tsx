'use client'

import type { CSSProperties } from 'react'
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
        renderSegment(style, position, color, {
          thicknessTopBottom,
          thicknessLeftRight,
        })
      )}
    </div>
  )
}

function renderSegment(
  style: string,
  position: FramePosition,
  color: string,
  dims: { thicknessTopBottom: number; thicknessLeftRight: number },
) {
  const thickness =
    position === 'top' || position === 'bottom'
      ? dims.thicknessTopBottom
      : dims.thicknessLeftRight

  if (style === 'line') {
    const isHorizontal = position === 'top' || position === 'bottom'
    const lineThickness = Math.max(1, thickness / 3)
    return (
      <div
        key={`${style}-${position}`}
        className="absolute"
        style={{
          ...(isHorizontal
            ? {
                left: 0,
                right: 0,
                height: `${lineThickness}px`,
                top: position === 'top' ? 0 : undefined,
                bottom: position === 'bottom' ? 0 : undefined,
              }
            : {
                top: 0,
                bottom: 0,
                width: `${lineThickness}px`,
                left: position === 'left' ? 0 : undefined,
                right: position === 'right' ? 0 : undefined,
              }),
          backgroundColor: color,
        }}
      />
    )
  }

  if (style === 'dots') {
    const isHorizontal = position === 'top' || position === 'bottom'
    const dotSize = Math.max(4, thickness / 2)
    return (
      <div
        key={`${style}-${position}`}
        className="absolute flex"
        style={{
          ...(isHorizontal
            ? {
                top: position === 'top' ? 0 : undefined,
                bottom: position === 'bottom' ? 0 : undefined,
                left: 0,
                right: 0,
                height: `${dotSize}px`,
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 4px',
              }
            : {
                left: position === 'left' ? 0 : undefined,
                right: position === 'right' ? 0 : undefined,
                top: 0,
                bottom: 0,
                width: `${dotSize}px`,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
              }),
        }}
      >
        {Array.from({ length: 12 }).map((_, idx) => (
          <span
            key={`${position}-dot-${idx}`}
            style={{
              display: 'inline-block',
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              borderRadius: '50%',
              backgroundColor: color,
              opacity: 0.85,
            }}
          />
        ))}
      </div>
    )
  }

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
