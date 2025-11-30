// src/components/AnimatedLogo.tsx
import React from 'react'
import './AnimatedLogo.css' // Importamos el CSS para las animaciones

/**
 * Logo animado que simula el efecto de un flipbook (pasar de página).
 * Una línea horizontal gira 180 grados, cambiando de color en cada paso
 * usando los colores del degradado: fuchsia, sky, emerald.
 */
export default function AnimatedLogo() {
  return (
    <div className="animated-logo-container" aria-hidden="true">
      <div className="animated-logo-line"></div>
    </div>
  )
}