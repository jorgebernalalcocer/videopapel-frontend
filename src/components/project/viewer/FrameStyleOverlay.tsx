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
          dimensions,
        })
      )}
    </div>
  )
}

function renderSegment(
  style: string,
  position: FramePosition,
  color: string,
  dims: { 
    thicknessTopBottom: number; 
    thicknessLeftRight: number; 
    dimensions: { width: number; height: number } 
  },
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

  // --- ESTILO 'DOTS' (SOLUCIÓN DEFINITIVA CON POSICIONAMIENTO ABSOLUTO) ---
  if (style === 'dots') {
    const { width, height } = dims.dimensions
    const isHorizontal = position === 'top' || position === 'bottom'
    
    const dotSize = Math.max(4, thickness / 2)
    const radius = dotSize / 2
    
    // REDUCCIÓN: El diámetro completo del punto (lo que dejamos libre en la esquina).
    const reduction = dotSize 

    // LONGITUD EFECTIVA: El área de dibujo después de recortar las esquinas.
    const effectiveLength = (isHorizontal ? width : height) - (reduction * 2) 

    if (effectiveLength < dotSize) return null 

    // Replicamos la lógica de espaciado del backend
    const spacingFactor = 3.5 
    const step = dotSize * spacingFactor 
    const numDots = Math.floor(effectiveLength / step)
    
    if (numDots < 2) return null 
    
    // Distancia entre el centro de los puntos (para distribución uniforme)
    const centerSpacing = effectiveLength / (numDots - 1) 
    
    const dotsArray = Array.from({ length: numDots })

    // 1. Estilos del contenedor principal 
    const thicknessCenterOffset = `calc(${thickness / 2}px - ${dotSize / 2}px)`
    
    let containerStyles: CSSProperties = {
        position: 'absolute',
        // Estilos base para el eje de la línea
        [isHorizontal ? 'left' : 'top']: `${reduction}px`,
        [isHorizontal ? 'right' : 'bottom']: `${reduction}px`,

        // Estilos para el grosor
        [isHorizontal ? 'height' : 'width']: `${dotSize}px`,
        [position]: thicknessCenterOffset, // Centrar el contenedor en el grosor del marco
        
        display: 'block', 
    }
    
    // Si la posición es 'top' o 'bottom', necesitamos asegurar que left/right están a 0
    if (isHorizontal) {
        containerStyles.left = `${reduction}px`
        containerStyles.right = `${reduction}px`
        containerStyles.width = `auto` // Permitir que el ancho se calcule por left/right
    } else {
        // Si la posición es 'left' o 'right', necesitamos asegurar que top/bottom están a 0
        containerStyles.top = `${reduction}px`
        containerStyles.bottom = `${reduction}px`
        containerStyles.height = `auto` // Permitir que la altura se calcule por top/bottom
    }

    return (
      <div
        key={`${style}-${position}`}
        className="absolute"
        style={containerStyles} 
      >
        {dotsArray.map((_, idx) => {
          // Posición del centro del punto desde el inicio de la longitud efectiva
          const centerPos = idx * centerSpacing
          
          // Posición del BORDE izquierdo/superior del punto (lo que usa CSS)
          // = Centro del punto - Radio
          const offsetPos = centerPos - radius

          return (
            <span
              key={`${position}-dot-${idx}`}
              style={{
                display: 'block',
                position: 'absolute', // CRUCIAL para que left/top funcionen
                width: `${dotSize}px`,
                height: `${dotSize}px`,
                borderRadius: '50%',
                backgroundColor: color,
                opacity: 0.85,
                // Aplicamos la posición calculada:
                ...(isHorizontal 
                    ? { left: `${offsetPos}px`, top: 0 } // Horizontal: 'left' es el offset calculado; 'top' es 0 (centrado por el contenedor).
                    : { top: `${offsetPos}px`, left: 0 } // Vertical: 'top' es el offset calculado; 'left' es 0 (centrado por el contenedor).
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

// --- Funciones auxiliares (sin cambios) ---

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