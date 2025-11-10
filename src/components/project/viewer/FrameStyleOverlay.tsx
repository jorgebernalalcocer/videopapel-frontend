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
          dimensions, // 👈 Pasamos las dimensiones al renderizador de segmento
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
    dimensions: { width: number; height: number }; // 👈 Propiedad añadida
  },
) {
  const thickness =
    position === 'top' || position === 'bottom'
      ? dims.thicknessTopBottom
      : dims.thicknessLeftRight

  // --- ESTILO 'LINE' (CORREGIDO) ---
  if (style === 'line') {
    const isHorizontal = position === 'top' || position === 'bottom'
    // Aseguramos un mínimo de 2px para visibilidad.
    const lineThickness = Math.max(2, thickness / 3) 
    
    return (
      <div
        key={`${style}-${position}`}
        className="absolute"
        style={{
          ...POSITION_STYLES[position], // Posicionamiento base
          backgroundColor: color,
          ...(isHorizontal
            ? {
                // Definimos la altura de la línea y la centramos dentro del grosor teórico
                height: `${lineThickness}px`,
                [position]: `calc(${thickness / 2}px - ${lineThickness / 2}px)`, 
              }
            : {
                // Definimos la anchura de la línea y la centramos dentro del grosor teórico
                width: `${lineThickness}px`,
                [position]: `calc(${thickness / 2}px - ${lineThickness / 2}px)`,
              }),
        }}
      />
    )
  }

// ... dentro de function renderSegment(...)

  // --- ESTILO 'DOTS' (MEJORADO CON ESPACIADO DINÁMICO) ---
  if (style === 'dots') {
    const { width, height } = dims.dimensions
    const isHorizontal = position === 'top' || position === 'bottom'
    
    // El 'totalLength' DEBE ser el tamaño de la línea que realmente dibujaremos, no el ancho/alto total.
    // Usaremos 'padding' o 'margin' para reducir la longitud real del área de dibujo.
    
    const dotSize = Math.max(4, thickness / 2)
    
    // La longitud que se va a dibujar debe ser reducida en 'dotSize' en cada esquina.
    // Esto es lo que evita la superposición.
    const reduction = dotSize 
    const totalLength = (isHorizontal ? width : height) - (reduction * 2) 

    // Si la longitud es muy pequeña, evitamos calcular los dots
    if (totalLength < dotSize * 2) return null 

    // Cálculo para espaciado uniforme
    const spacingFactor = 3.5 // Múltiplo del dotSize para el paso (e.g., 1 punto + 2.5 espacio)
    const step = dotSize * spacingFactor
    const numDots = Math.floor(totalLength / step)
    
    if (numDots < 2) return null 
    
    // ... (el cálculo de 'space' y 'dotsArray' sigue igual)
    const remainingLength = totalLength - (numDots * dotSize)
    const space = remainingLength / (numDots - 1)
    
    const dotsArray = Array.from({ length: numDots })

    return (
      <div
        key={`${style}-${position}`}
        className="absolute flex items-center justify-between"
        style={{
          ...POSITION_STYLES[position],
          // 👈 AQUÍ ESTÁN LOS CAMBIOS CLAVE: AÑADIR `left`/`right` o `top`/`bottom`
          // Esto recorta la longitud de la línea para evitar la esquina.
          ...(isHorizontal
            ? {
                // Segmentos horizontales (top, bottom)
                // Se mueven a la derecha 'reduction' (dotSize) y se encogen 'reduction' del otro lado
                left: `${reduction}px`,   
                right: `${reduction}px`,
                height: `${dotSize}px`,
                // Centrar la fila de puntos verticalmente (sin cambios)
                top: position === 'top' 
                    ? `calc(${thickness / 2}px - ${dotSize / 2}px)`
                    : undefined,
                bottom: position === 'bottom' 
                    ? `calc(${thickness / 2}px - ${dotSize / 2}px)`
                    : undefined,
                flexDirection: 'row',
              }
            : {
                // Segmentos verticales (left, right) - NO SE MODIFICAN
                // Deben ir de borde a borde para 'llenar' el hueco de la esquina.
                top: `${reduction}px`,
                bottom: `${reduction}px`,
                width: `${dotSize}px`,
                // Centrar la columna de puntos horizontalmente (sin cambios)
                left: position === 'left'
                    ? `calc(${thickness / 2}px - ${dotSize / 2}px)`
                    : undefined,
                right: position === 'right' 
                    ? `calc(${thickness / 2}px - ${dotSize / 2}px)`
                    : undefined,
                flexDirection: 'column',
              }),
        }}
      >
        {/* ... (mapeo de puntos sin cambios) */}
        {dotsArray.map((_, idx) => (
          <span
            key={`${position}-dot-${idx}`}
            style={{
              display: 'inline-block',
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              minWidth: `${dotSize}px`, 
              minHeight: `${dotSize}px`, 
              borderRadius: '50%',
              backgroundColor: color,
              opacity: 0.85,
            }}
          />
        ))}
      </div>
    )
  }

  // --- ESTILO 'FILL' (ORIGINAL) ---
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

// --- FUNCIONES AUXILIARES (Sin cambios, incluidas para que el código sea completo) ---

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