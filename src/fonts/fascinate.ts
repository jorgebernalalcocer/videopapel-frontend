'use client'

import { Fascinate } from 'next/font/google'

/**
 * Carga de la fuente Pacifico desde Google Fonts.
 * Usa pacifico.className o pacifico.variable para aplicar la tipografía.
 */
export const fascinate = Fascinate({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-fascinate',
})

/**
 * Helper CSS para aplicar la fuente en estilos en línea.
 */
export const fascinateFontStack = '"Fascinate", "Comic Sans MS", cursive'
