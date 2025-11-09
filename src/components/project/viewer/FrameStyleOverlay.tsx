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

  const baseThicknessPx = setting.thickness_px || 8
  const ppi = Math.max(1, printQualityPpi || FALLBACK_PPI)

  const frameName = (setting.frame?.name || '').toLowerCase()
  const color = getFrameColor(frameName)
  const thicknessTopBottom = computeThicknessPx({
    thicknessPx: baseThicknessPx,
    ppi,
    dimensionMm: printHeightMm,
    dimensionPx: dimensions.height,
  })
  const thicknessLeftRight = computeThicknessPx({
    thicknessPx: baseThicknessPx,
    ppi,
    dimensionMm: printWidthMm,
    dimensionPx: dimensions.width,
  })

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
      {uniquePositions.map((position) => (
        <div
          key={position}
          className="absolute"
          style={{
            ...POSITION_STYLES[position],
            backgroundColor: color,
            ...(position === 'top' || position === 'bottom'
              ? { height: `${thicknessTopBottom}px` }
              : { width: `${thicknessLeftRight}px` }),
          }}
        />
      ))}
    </div>
  )
}

function computeThicknessPx({
  thicknessPx,
  ppi,
  dimensionMm,
  dimensionPx,
}: {
  thicknessPx: number
  ppi: number
  dimensionMm?: number | null
  dimensionPx: number
}) {
  const minDimensionPx = Math.max(1, dimensionPx)
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

function getFrameColor(name: string): string {
  if (name === 'cine' || name === 'cinema') {
    return 'rgba(0,0,0,0.92)'
  }
  return DEFAULT_COLOR
}
