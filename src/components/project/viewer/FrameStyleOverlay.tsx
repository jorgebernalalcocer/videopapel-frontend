'use client'

import type { CSSProperties } from 'react'
import type { FrameSettingClient, FramePosition } from '@/types/frame'

type Props = {
  setting?: FrameSettingClient | null
  dimensions: { width: number; height: number }
}

const POSITION_STYLES: Record<FramePosition, CSSProperties> = {
  top: { top: 0, left: 0, right: 0 },
  bottom: { bottom: 0, left: 0, right: 0 },
  left: { top: 0, bottom: 0, left: 0 },
  right: { top: 0, bottom: 0, right: 0 },
}

const DEFAULT_COLOR = 'rgba(0,0,0,0.9)'

export default function FrameStyleOverlay({ setting, dimensions }: Props) {
  if (!setting || !setting.positions || !setting.positions.length) return null
  if (!dimensions.width || !dimensions.height) return null

  const uniquePositions = Array.from(new Set(setting.positions)) as FramePosition[]
  if (!uniquePositions.length) return null

  const maxThickness = Math.floor(Math.min(dimensions.height, dimensions.width) / 2)
  const thickness = Math.max(2, Math.min(setting.thickness_px || 8, maxThickness || setting.thickness_px || 8))
  const frameName = (setting.frame?.name || '').toLowerCase()
  const color = getFrameColor(frameName)

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
              ? { height: `${thickness}px` }
              : { width: `${thickness}px` }),
          }}
        />
      ))}
    </div>
  )
}

function getFrameColor(name: string): string {
  if (name === 'cine' || name === 'cinema') {
    return 'rgba(0,0,0,0.92)'
  }
  return DEFAULT_COLOR
}
